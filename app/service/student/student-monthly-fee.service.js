import {v4 as uuidv4} from 'uuid';
import db from '../../db/models';
import {badRequest, FIELD_ERROR} from '../../config/error';
import {hex2binary} from "../../util/string.util";
import {formatDateTime, formatTemplateMoney, personToPrintData} from "../template/template.util";
import {templateRenderPDF} from "../template/template-render.service";
import {getEmailTemplate} from "../template/template-email.service";
import Mustache from "mustache";
import {EMAIL_ATTACHMENT_TYPE} from "../../db/models/email/email-attachment";
import {addEmailQueue} from "../email/company-email.service";

const {Op} = db.Sequelize;

export async function listStudentMonthlyFee(query, order, offset, limit, user) {
  const {search, month: monthStr} = query;
  const where = {};
  let wherePerson = {};
  if (search && search.length) {
    wherePerson = {
      [Op.or]: [
        {
          firstName: {
            [Op.like]: `%${search}%`
          }
        }, {
          lastName: {
            [Op.like]: `%${search}%`
          }
        }
      ]
    };
  }
  if (monthStr && monthStr.length) {
    const selectDate = new Date(monthStr);
    const month = selectDate.getMonth() + 1;
    const year = selectDate.getFullYear();
    where.monthFee = month;
    where.yearFee = year;
  }
  where.companyId = user.companyId;
  const resp = await db.StudentMonthlyFee.findAndCountAll({
    order,
    where,
    include: [
      {
        model: db.Student, as: 'student',
        required: true,
        include: [
          {model: db.Person, as: 'child', where: wherePerson, required: true,}
        ]
      }
    ],
    offset,
    limit
  });
  const {rows, count} = resp;
  const response = rows.map(r => {
    const uuid = Buffer.from(r.id, 'hex').toString('hex');
    const rs = r.get({plain: true});
    rs.id = uuid;
    return rs;
  });
  return {
    count,
    rows: response
  }
}

export async function getStudentMonthlyFee(sId, user) {
  const splitIds = sId.split(',');
  const ids = [];
  for (let i = 0; i < splitIds.length; i += 1) {
    ids.push(Buffer.from(splitIds[i], 'hex'));
  }
  const students = await db.StudentMonthlyFee.findAll({
    where: {
      id: ids,
      companyId: user.companyId
    },
    include: [
      {
        model: db.Student, as: 'student',
        include: [
          {
            model: db.Person, as: 'child',
            attributes: ['id', 'firstName', 'lastName', 'name']
          }
        ]
      }
    ]
  });
  return students.map(r => {
    const uuid = Buffer.from(r.id, 'hex').toString('hex');
    const rs = r.get({plain: true});
    rs.id = uuid;
    return rs;
  });
}

export async function createStudentMonthlyFee(user, createForm) {
  try {
    if (createForm && createForm.details) {
      for (let i = 0; i < createForm.details.length; i += 1) {
        const splitMonthYear = createForm.details[i].monthYear.split('-');
        const month = splitMonthYear[1];
        const year = splitMonthYear[0];
        const uuidS = hex2binary(uuidv4());
        // eslint-disable-next-line no-await-in-loop
        const studentFee = await db.StudentMonthlyFee.findOne({
          where: {
            studentId: +createForm.details[i].studentId,
            companyId: user.companyId,
            monthFee: +month,
            yearFee: +year
          },
          include: [
            {
              model: db.Student, as: 'student',
              include: [
                {model: db.Person, as: 'child'}
              ]
            }
          ]
        });
        if (studentFee) {
          throw badRequest('student', FIELD_ERROR.INVALID, `student ${studentFee.student.child.fistName} ${studentFee.student.child.lastName} exist`);
        }
        // eslint-disable-next-line no-await-in-loop
        await db.StudentMonthlyFee.create({
          id: uuidS,
          monthFee: month,
          yearFee: year,
          scholarShip: createForm.details[i].scholarShip,
          studentId: createForm.details[i].studentId,
          companyId: user.companyId,
          absentDay: createForm.details[i].absentDay,
          absentDayFee: createForm.details[i].absentDayFee,
          trialDate: createForm.details[i].trialDate,
          trialDateFee: createForm.details[i].trialDateFee,
          busFee: createForm.details[i].busFee,
          mealFee: createForm.details[i].mealFee,
          otherFee: +createForm.details[i].otherFee,
          otherDeduceFee: +createForm.details[i].otherDeduceFee,
          remark: createForm.details[i].remark,
          feePerMonth: createForm.details[i].feePerMonth,
          totalAmount: createForm.details[i].totalAmount,
          lastUpdatedDate: new Date(),
          lastUpdatedById: user.id
        });
      }
    }
    return true;
  } catch (e) {
    console.log(e);
    throw badRequest('student', FIELD_ERROR.INVALID, 'student Exist');
  }
}

export async function updateStudentMonthlyFee(sId, updateForm, user) {
  console.log(sId);
  try {
    if (updateForm && updateForm.details) {
      for (let i = 0; i < updateForm.details.length; i += 1) {
        const splitMonthYear = updateForm.details[i].monthYear.split('-');
        const month = splitMonthYear[1];
        const year = splitMonthYear[0];
        // eslint-disable-next-line no-await-in-loop
        const studentFee = await db.StudentMonthlyFee.findOne({
          where: {
            id: Buffer.from(updateForm.details[i].id, 'hex'),
            companyId: user.companyId
          }
        });
        if (!studentFee) {
          throw badRequest('studentFee', FIELD_ERROR.INVALID, `Student Fee not exist`);
        }
        // eslint-disable-next-line no-await-in-loop
        await studentFee.update({
          monthFee: month,
          yearFee: year,
          scholarShip: updateForm.details[i].scholarShip,
          scholarFee: updateForm.details[i].scholarFee,
          studentId: updateForm.details[i].studentId,
          companyId: user.companyId,
          absentDay: updateForm.details[i].absentDay,
          absentDayFee: updateForm.details[i].absentDayFee,
          trialDate: updateForm.details[i].trialDate,
          trialDateFee: updateForm.details[i].trialDateFee,
          busFee: updateForm.details[i].busFee,
          mealFee: updateForm.details[i].mealFee,
          otherFee: +updateForm.details[i].otherFee,
          otherDeduceFee: +updateForm.details[i].otherDeduceFee,
          remark: updateForm.details[i].remark,
          feePerMonth: updateForm.details[i].feePerMonth,
          totalAmount: updateForm.details[i].totalAmount,
          lastUpdatedDate: new Date(), lastUpdatedById: user.id
        });
      }
    }
    return true;
  } catch (error) {
    throw error;
  }
}

export async function removeStudentMonthlyFee(sId, user) {
  const bId = hex2binary(sId);
  console.log(bId, user.companyId);
  const checkStudent = await db.StudentMonthlyFee.findOne({
    where: {
      id: bId,
      companyId: user.companyId
    }
  });
  if (!checkStudent) {
    throw badRequest('student', FIELD_ERROR.INVALID, 'Student fee not found');
  }

  return db.StudentMonthlyFee.destroy({
    where: {
      id: bId
    }
  });
}

export async function toPrintData(id, companyId) {
  const bId = hex2binary(id);
  const fee = await db.StudentMonthlyFee.findOne({
    where: {
      id: bId,
      companyId
    }, include: [
      {
        model: db.Student, as: 'student',
        include: [
          {
            model: db.Person, as: 'child'
          }, {
            model: db.Person, as: 'father'
          }, {
            model: db.Person, as: 'mother'
          }
        ]
      }
    ]
  });
  const studentFee = {
    monthFee: fee.monthFee,
    yearFee: fee.yearFee,
    scholarShip: formatTemplateMoney(fee.scholarFee),
    scholarShipPercent: `${fee.scholarShip} %`,
    scholarFee: formatTemplateMoney(fee.feePerMonth),
    mealFee: formatTemplateMoney(fee.mealFee),
    absentDate: fee.absentDate,
    deduceTuition: formatTemplateMoney(fee.deduceTuition),
    busFee: formatTemplateMoney(fee.busFee),
    beginningYearFee: formatTemplateMoney(fee.beginningYearFee),
    otherFee: formatTemplateMoney(fee.otherFee),
    otherDeduceFee: formatTemplateMoney(fee.otherDeduceFee),
    debt: formatTemplateMoney(fee.debt),
    remark: fee.remark
  };
  const student = personToPrintData(fee.student.child);

  const father = personToPrintData(fee.student.father);

  const mother = personToPrintData(fee.student.mother);

  return {
    name: `${student.firstName} ${student.lastName}_${formatDateTime(fee.lastUpdatedDate)}`,
    studentFee, student, mother, father
  }
}

export async function generatePDF(templateId, feeId, companyId) {
  const templateData = await toPrintData(feeId, companyId);
  return templateRenderPDF(templateId, templateData, templateData.name);
}

async function processSendEmailForFee(feeId, emailTemplate, printTemplateId, isPDFAttached, user, from, cc) {
  const attachments = [];
  const templateData = await toPrintData(feeId, user.companyId);
  if (isPDFAttached) {
    attachments.push(
      {
        type: EMAIL_ATTACHMENT_TYPE.ASSET,
        data: await templateRenderPDF(printTemplateId, templateData, templateData.name)
      }
    );
  }
  const {subject, template: {content}} = emailTemplate;

  const subjectText = Mustache.render(subject, templateData);
  const contentHTML = Mustache.render(content, templateData);

  const to = [];
  const {father, mother} = templateData;
  if (father && father.email) {
    to.push(`${father.firstName} ${father.lastName} <${father.email}>`)
  }
  if (mother && mother.email) {
    to.push(`${mother.firstName} ${mother.lastName} <${mother.email}>`)
  }

  const emailMessage = {
    from,
    cc,
    to: to.join(','),
    subject: subjectText,
    message: contentHTML,
    attachments
  }
  return addEmailQueue(emailMessage, user.companyId, user.id);
}

export async function sendEmails({listId, emailTemplateId, isPDFAttached, printTemplateId, from, cc}, user) {
  const emailTemplate = await getEmailTemplate(emailTemplateId, user);
  if (!emailTemplate) {
    throw badRequest('EmailTemplate', 'NOT_FOUND', 'Invalid email template');
  }
  const rs = {
    success: [],
    fail: []
  };
  for (let i = 0; i < listId.length; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop,no-unused-vars
      const email = await processSendEmailForFee(listId[i], emailTemplate, printTemplateId, isPDFAttached, user, from, cc);
      rs.success.push(listId[i]);
    } catch (e) {
      console.error(e);
      rs.fail.push(listId[i]);
    }
  }
  return rs;
}