import {initWebAuthController} from './auth.controller';
import {initWebWarehouseController} from './warehouse/warehouse.controller';
import {initWebCompanyController} from './company/company.controller';
import {initWebInventoryController} from './inventory/inventory.controller';
import {initWebInventoryGoodReceiptController} from './inventory/goods-receipt.controller';
import {initWebInventoryGoodIssueController} from './inventory/goods-issue.controller';
import {initWebProductController} from './product/product.controller';
import {initWebInventorySummaryController} from './inventory/inventory-summary.controller';
import {initWebOrderPurchaseController} from './order/purchase.controller';
import {initWebOrderSaleController} from './order/sale.controller';
import {initWebCostController} from './cost/cost.controller';
import {initWebAssetController} from './asset.controller';
import {initWebPersonController} from './person/person.controller';
import {initEmailConfigurationController} from "./configuration/email.controller";
import {initWebStudentController} from './student/student.controller';
import {initWebStudentMonthlyFeeController} from './student/student-monthly-fee.controller';
import {initTemplateController} from "./template/template.controller";
import {initTemplateTypeController} from "./template/template-type.controller";
import {initSurveyController} from "./survey/survey.controller";
import {initWebSurveyAdminController} from './survey/survey-admin.controller';
import {initSurveyQuestionAdminController} from './survey/survey-question-admin.controller';
import {initEmailTemplateController} from "./template/template-email.controller";


export function initWebController(app) {
  initWebAuthController(app);
  initWebWarehouseController(app);
  initWebCompanyController(app);
  initWebInventoryController(app);
  initWebInventoryGoodReceiptController(app);
  initWebInventoryGoodIssueController(app);
  initWebInventorySummaryController(app);
  initWebProductController(app);
  initWebOrderPurchaseController(app);
  initWebOrderSaleController(app);
  initWebCostController(app);
  initWebPersonController(app);
  initWebAssetController(app);
  initEmailConfigurationController(app);
  initWebStudentController(app);
  initWebStudentMonthlyFeeController(app);
  initTemplateController(app);
  initTemplateTypeController(app);
  initSurveyController(app);
  initWebSurveyAdminController(app);
  initSurveyQuestionAdminController(app);
  initEmailTemplateController(app);
}
