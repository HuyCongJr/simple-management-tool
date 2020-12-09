import Sequelize from 'sequelize';

const {DataTypes} = Sequelize;
export const PERMISSION = {
  PRODUCT: {
    CREATE: 1,
    READ: 2,
    UPDATE: 3,
    DELETE: 4
  },
  CUSTOMER: {
    CREATE: 5,
    READ: 6,
    UPDATE: 7,
    DELETE: 8
  },
  ORDER: {
    SALE: {
      CREATE: 9,
      READ: 10,
      UPDATE: 11,
      DELETE: 12
    },
    PURCHASE: {
      CREATE: 25,
      READ: 26,
      UPDATE: 27,
      DELETE: 28
    }
  },
  INVENTORY: {
    GOODS_RECEIPT: {
      CREATE: 13,
      READ: 14,
      UPDATE: 15,
      DELETE: 16
    },
    GOODS_ISSUE: {
      CREATE: 21,
      READ: 22,
      UPDATE: 23,
      DELETE: 24
    },
    READ: 38
  },
  WAREHOUSE: {
    CREATE: 17,
    READ: 18,
    UPDATE: 19,
    DELETE: 20
  },
  COST: {
    CREATE: 29,
    READ: 30,
    UPDATE: 31,
    DELETE: 32
  },
  PERSON: {
    CREATE: 33,
    READ: 34,
    UPDATE: 35,
    DELETE: 36
  },
  COMPANY: {
    CREATE: 39,
    READ: 40,
    UPDATE: 41,
    DELETE: 42
  },
  IMAGE: {
    READ: 37
  },
  CONFIGURATION: 43,
  TEMPLATE: {
    CREATE: 44,
    READ: 45,
    UPDATE: 46,
    DELETE: 47
  },
  EMAIL: {
    SEND: 48,
    READ: 49
  },
  LOGIN: 50,
  AUDIT: 51
};

export const ALL_PERMISSIONS = [
  PERMISSION.PRODUCT.CREATE, PERMISSION.PRODUCT.READ, PERMISSION.PRODUCT.UPDATE, PERMISSION.PRODUCT.DELETE,
  PERMISSION.CUSTOMER.CREATE, PERMISSION.CUSTOMER.READ, PERMISSION.CUSTOMER.UPDATE, PERMISSION.CUSTOMER.DELETE,
  PERMISSION.ORDER.SALE.CREATE, PERMISSION.ORDER.SALE.READ, PERMISSION.ORDER.SALE.UPDATE, PERMISSION.ORDER.SALE.DELETE,
  PERMISSION.ORDER.PURCHASE.CREATE, PERMISSION.ORDER.PURCHASE.READ, PERMISSION.ORDER.PURCHASE.UPDATE, PERMISSION.ORDER.PURCHASE.DELETE,
  PERMISSION.INVENTORY.READ, PERMISSION.INVENTORY.GOODS_ISSUE.CREATE, PERMISSION.INVENTORY.GOODS_ISSUE.READ,
  PERMISSION.INVENTORY.GOODS_ISSUE.UPDATE, PERMISSION.INVENTORY.GOODS_ISSUE.DELETE,
  PERMISSION.INVENTORY.GOODS_RECEIPT.CREATE, PERMISSION.INVENTORY.GOODS_RECEIPT.READ,
  PERMISSION.INVENTORY.GOODS_RECEIPT.UPDATE, PERMISSION.INVENTORY.GOODS_RECEIPT.DELETE,
  PERMISSION.WAREHOUSE.CREATE, PERMISSION.WAREHOUSE.READ, PERMISSION.WAREHOUSE.UPDATE, PERMISSION.WAREHOUSE.DELETE,
  PERMISSION.COST.CREATE, PERMISSION.COST.READ, PERMISSION.COST.UPDATE, PERMISSION.COST.DELETE,
  PERMISSION.PERSON.CREATE, PERMISSION.PERSON.READ, PERMISSION.PERSON.UPDATE, PERMISSION.PERSON.DELETE,
  PERMISSION.COMPANY.CREATE, PERMISSION.COMPANY.READ, PERMISSION.COMPANY.UPDATE, PERMISSION.COMPANY.DELETE,
  PERMISSION.IMAGE.READ,
  PERMISSION.CONFIGURATION,
  PERMISSION.TEMPLATE.CREATE, PERMISSION.TEMPLATE.READ, PERMISSION.TEMPLATE.UPDATE, PERMISSION.TEMPLATE.DELETE
];

export default class ACLAction extends Sequelize.Model {
  static init(sequelize, opts) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        moduleId: {type: DataTypes.INTEGER},
        name: {type: DataTypes.STRING(255)},
        remark: {type: DataTypes.TEXT}
      },
      {
        tableName: 'acl_action',
        modelName: 'aclAction',
        timestamps: false,
        sequelize, ...opts
      }
    );
  }

  static associate(models) {
    this.belongsToMany(models.ACLGroupAction, {
      through: models.ACLGroupAction,
      foreignKey: 'actionId',
      otherKey: 'groupId'
    });
    this.belongsTo(models.ACLModule, {foreignKey: 'moduleId', as: 'modules'});
  }
}
