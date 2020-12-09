import db from '../../db/models';

import { createOrderDetail, removeOrderDetail } from './order-detail.service';
import { badRequest, FIELD_ERROR } from '../../config/error';
import User from '../../db/models/user/user';

const { Op } = db.Sequelize;

export function sumTotalProduct(orderDetailsForm) {
  const result = orderDetailsForm.reduce((valOld, valNew) => valOld + (valNew.quantity * valNew.price), 0);
  return result;
}

export function orders(type, search, order, offset, limit, user) {
  const where = { type };
  if (search) {
    if (search.search && search.search.length) {
      where.name = {
        [Op.like]: `%${search.search}%`
      };
    }
    if (search.partnerCompanyId) {
      where.partnerCompanyId = search.partnerCompanyId;
    }
    if (search.partnerPersonId) {
      where.partnerPersonId = search.partnerPersonId;
    }
    if (search.startDate && search.startDate.length
      && search.endDate && search.endDate.length) {
      const dateObjEndDate = new Date(search.endDate);
      dateObjEndDate.setHours(dateObjEndDate.getHours() + 24);
      where.processedDate = {
        [Op.lt]: dateObjEndDate,
        [Op.gte]: new Date(search.startDate)
      };
    } else if (search.endDate && search.endDate.length) {
      const dateObjEndDate = new Date(search.endDate);
      dateObjEndDate.setHours(dateObjEndDate.getHours() + 24);
      where.processedDate = {
        [Op.lt]: dateObjEndDate
      };
    } else if (search.startDate && search.startDate.length) {
      where.processedDate = {
        [Op.gte]: new Date(search.startDate)
      };
    }
  }
  where.companyId = user.companyId;
  return db.Order.findAndCountAll({
    order,
    include: [
      {
        model: User, as: 'createdBy',
        attributes: ['id', 'displayName', 'email']
      }, {
        model: User, as: 'lastModifiedBy',
        attributes: ['id', 'displayName', 'email']
      },
      { model: db.Company, as: 'partnerCompany', attributes: ['id', 'name'] },
      { model: db.Person, as: 'partnerPerson', attributes: ['id', 'firstName', 'lastName', 'name'] }
    ],
    where,
    offset,
    limit
  });
}

export async function getOrder(oId, user) {
  const order = await db.Order.findOne({
    where: {
      [Op.and]: [
        { id: oId },
        { companyId: user.companyId }
      ]
    },
    include: [
      { model: db.Person, as: 'partnerPerson', attributes: ['id', 'firstName', 'lastName', 'name', 'email'] },
      { model: db.Company, as: 'partnerCompany', attributes: ['id', 'name', 'address', 'gsm'] },
      {
        model: db.OrderDetail, as: 'details',
        include: [
          { model: db.Product, as: 'product', attributes: ['id', 'name', 'remark'] },
          {
            model: db.ProductUnit, as: 'unit',
            where: {
              productId: {
                [Op.eq]: db.Sequelize.col('details.productId')
              }
            }
          }
        ]
      }
    ]
  });
  if (!order) {
    throw badRequest('order', FIELD_ERROR.INVALID, 'order not found');
  }
  return order;
}

export async function createOrder(user, type, createForm) {
  const transaction = await db.sequelize.transaction();
  try {
    const totalAmount = await sumTotalProduct(createForm.details);
    const order = await db.Order.create({
      name: createForm.name,
      remark: createForm.remark,
      partnerCompanyId: createForm.partnerCompanyId,
      partnerPersonId: createForm.partnerPersonId,
      createdById: user.id,
      companyId: user.companyId,
      processedDate: new Date(),
      type: type,
      totalAmount: totalAmount,
      createdDate: new Date()
    }, { transaction });

    if (createForm.details && createForm.details.length) {
      await createOrderDetail(order.id, createForm.details, transaction);
    }

    if (createForm.partnerCompanyId && createForm.partnerCompanyId) {
      await db.PartnerCompanyPerson.findOrCreate({
        where: {
          partnerCompanyId: createForm.partnerCompanyId,
          personId: createForm.partnerPersonId
        },
        defaults: {
          partnerCompanyId: createForm.partnerCompanyId,
          personId: createForm.partnerPersonId
        },
        transaction
      });
    }

    await transaction.commit();
    return order;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateOrder(oId, user, type, updateForm) {
  const existedOrder = await db.Order.findOne({
    where: {
      [Op.and]: [
        { id: oId },
        { companyId: user.companyId }
      ]
    }
  });
  if (!existedOrder) {
    throw badRequest('order', FIELD_ERROR.INVALID, 'order not found');
  }
  const transaction = await db.sequelize.transaction();
  try {

    const totalAmount = await sumTotalProduct(updateForm.details);

    await existedOrder.update({
      name: updateForm.name,
      remark: updateForm.remark,
      partnerCompanyId: updateForm.partnerCompanyId,
      partnerPersonId: updateForm.partnerPersonId,
      companyId: user.companyId,
      processedDate: new Date(),
      type: type,
      totalAmount: totalAmount,
      lastModifiedDate: new Date(),
      lastModifiedById: user.id
    }, transaction);

    if (updateForm.partnerCompanyId && updateForm.partnerPersonId) {
      await db.PartnerCompanyPerson.findOrCreate({
        where: {
          partnerCompanyId: updateForm.partnerCompanyId,
          personId: updateForm.partnerPersonId
        },
        defaults: {
          partnerCompanyId: updateForm.partnerCompanyId,
          personId: updateForm.partnerPersonId
        },
        transaction
      });
    }
    if (updateForm.details && updateForm.details.length) {
      await removeOrderDetail(existedOrder.id, transaction);
      await createOrderDetail(existedOrder.id, updateForm.details, transaction);
    }

    await transaction.commit();
    return existedOrder;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

}

export async function removeOrder(oId, user) {
  const checkOrder = await db.Order.findOne({
    where: {
      [Op.and]: [
        { id: oId },
        { companyId: user.companyId }
      ]
    }
  });
  if (!checkOrder) {
    throw badRequest('order', FIELD_ERROR.INVALID, 'order not found');
  }
  const transaction = await db.sequelize.transaction();
  try {
    await removeOrderDetail(checkOrder.id, transaction);
    const order = db.Order.destroy({
      where: { id: checkOrder.id }
    }, { transaction });
    await transaction.commit();
    return order;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
