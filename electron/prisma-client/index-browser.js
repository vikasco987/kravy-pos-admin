
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.RolePermissionScalarFieldEnum = {
  id: 'id',
  role: 'role',
  allowedPaths: 'allowedPaths',
  updatedAt: 'updatedAt'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  clerkId: 'clerkId',
  sortOrder: 'sortOrder',
  parentId: 'parentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  zones: 'zones'
};

exports.Prisma.ItemScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  price: 'price',
  sellingPrice: 'sellingPrice',
  gst: 'gst',
  unit: 'unit',
  barcode: 'barcode',
  taxStatus: 'taxStatus',
  imageUrl: 'imageUrl',
  image: 'image',
  categoryId: 'categoryId',
  clerkId: 'clerkId',
  userId: 'userId',
  isActive: 'isActive',
  openingStock: 'openingStock',
  currentStock: 'currentStock',
  reorderLevel: 'reorderLevel',
  inventoryCode: 'inventoryCode',
  isVeg: 'isVeg',
  isEgg: 'isEgg',
  isBestseller: 'isBestseller',
  isRecommended: 'isRecommended',
  isNew: 'isNew',
  isFavorite: 'isFavorite',
  spiciness: 'spiciness',
  rating: 'rating',
  hiName: 'hiName',
  mrName: 'mrName',
  taName: 'taName',
  upsellText: 'upsellText',
  hsnCode: 'hsnCode',
  variants: 'variants',
  tags: 'tags',
  zones: 'zones',
  packagingCharges: 'packagingCharges',
  gstType: 'gstType',
  taxRate: 'taxRate',
  calories: 'calories',
  protein: 'protein',
  shortCode: 'shortCode',
  addonGroupIds: 'addonGroupIds',
  expiryDate: 'expiryDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RawMaterialScalarFieldEnum = {
  id: 'id',
  clerkId: 'clerkId',
  userId: 'userId',
  name: 'name',
  unit: 'unit',
  stock: 'stock',
  minStock: 'minStock',
  price: 'price',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RecipeItemScalarFieldEnum = {
  id: 'id',
  itemId: 'itemId',
  materialId: 'materialId',
  quantity: 'quantity'
};

exports.Prisma.AddonGroupScalarFieldEnum = {
  id: 'id',
  clerkId: 'clerkId',
  userId: 'userId',
  name: 'name',
  isCompulsory: 'isCompulsory',
  minSelection: 'minSelection',
  maxSelection: 'maxSelection',
  allowMultipleUnits: 'allowMultipleUnits',
  items: 'items',
  categoryIds: 'categoryIds',
  itemIds: 'itemIds',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PartyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  phone: 'phone',
  address: 'address',
  dob: 'dob',
  createdBy: 'createdBy',
  loyaltyPoints: 'loyaltyPoints',
  walletBalance: 'walletBalance',
  remarks: 'remarks',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  billId: 'billId',
  amount: 'amount',
  mode: 'mode',
  txnRef: 'txnRef',
  paidAt: 'paidAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  clerkId: 'clerkId',
  phone: 'phone',
  password: 'password',
  isVerified: 'isVerified',
  otpCode: 'otpCode',
  otpExpiry: 'otpExpiry',
  role: 'role',
  imageUrl: 'imageUrl',
  secondaryEmails: 'secondaryEmails',
  secondaryPhones: 'secondaryPhones',
  isDisabled: 'isDisabled',
  ownerId: 'ownerId',
  allowedPaths: 'allowedPaths',
  enableMultipleProfiles: 'enableMultipleProfiles',
  publicMetadata: 'publicMetadata',
  privateMetadata: 'privateMetadata',
  unsafeMetadata: 'unsafeMetadata',
  uiPreferences: 'uiPreferences',
  createdAt: 'createdAt'
};

exports.Prisma.UserSessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  staffId: 'staffId',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  deviceType: 'deviceType',
  browser: 'browser',
  os: 'os',
  lastActive: 'lastActive',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.TableScalarFieldEnum = {
  id: 'id',
  name: 'name',
  qrUrl: 'qrUrl',
  zone: 'zone',
  clerkUserId: 'clerkUserId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  orderNumber: 'orderNumber',
  clerkUserId: 'clerkUserId',
  tableId: 'tableId',
  items: 'items',
  orderId: 'orderId',
  total: 'total',
  deliveryCharges: 'deliveryCharges',
  packagingCharges: 'packagingCharges',
  status: 'status',
  parentOrderId: 'parentOrderId',
  caseType: 'caseType',
  isMerged: 'isMerged',
  mergedAt: 'mergedAt',
  isDeleted: 'isDeleted',
  deletedAt: 'deletedAt',
  deletedSnapshot: 'deletedSnapshot',
  relatedOrders: 'relatedOrders',
  customerName: 'customerName',
  customerPhone: 'customerPhone',
  customerAddress: 'customerAddress',
  paymentMode: 'paymentMode',
  isKotPrinted: 'isKotPrinted',
  isBillPrinted: 'isBillPrinted',
  notes: 'notes',
  preferences: 'preferences',
  zoneName: 'zoneName',
  tokenNumber: 'tokenNumber',
  kotNumbers: 'kotNumbers',
  inventoryDeducted: 'inventoryDeducted',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  itemId: 'itemId',
  clerkUserId: 'clerkUserId',
  rating: 'rating',
  comment: 'comment',
  customerName: 'customerName',
  tableId: 'tableId',
  imageUrl: 'imageUrl',
  createdAt: 'createdAt'
};

exports.Prisma.FormScalarFieldEnum = {
  id: 'id',
  title: 'title',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FieldScalarFieldEnum = {
  id: 'id',
  formId: 'formId',
  label: 'label',
  type: 'type',
  required: 'required',
  options: 'options',
  value: 'value',
  createdAt: 'createdAt'
};

exports.Prisma.BusinessProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  businessType: 'businessType',
  businessName: 'businessName',
  businessTagLine: 'businessTagLine',
  contactPersonName: 'contactPersonName',
  contactPersonPhone: 'contactPersonPhone',
  contactPersonEmail: 'contactPersonEmail',
  businessEmail: 'businessEmail',
  upi: 'upi',
  upiQrEnabled: 'upiQrEnabled',
  menuLinkEnabled: 'menuLinkEnabled',
  profileImageUrl: 'profileImageUrl',
  logoUrl: 'logoUrl',
  signatureUrl: 'signatureUrl',
  gstNumber: 'gstNumber',
  businessAddress: 'businessAddress',
  state: 'state',
  district: 'district',
  pinCode: 'pinCode',
  taxEnabled: 'taxEnabled',
  taxRate: 'taxRate',
  gstType: 'gstType',
  perProductTaxEnabled: 'perProductTaxEnabled',
  taxInclusive: 'taxInclusive',
  servedStatusLabel: 'servedStatusLabel',
  enableFuelBilling: 'enableFuelBilling',
  enableHotelManagement: 'enableHotelManagement',
  collectCustomerName: 'collectCustomerName',
  requireCustomerName: 'requireCustomerName',
  collectCustomerPhone: 'collectCustomerPhone',
  requireCustomerPhone: 'requireCustomerPhone',
  collectCustomerAddress: 'collectCustomerAddress',
  requireCustomerAddress: 'requireCustomerAddress',
  greetingMessage: 'greetingMessage',
  businessNameSize: 'businessNameSize',
  tokenNumberSize: 'tokenNumberSize',
  businessAddressSize: 'businessAddressSize',
  fssaiNumber: 'fssaiNumber',
  fssaiEnabled: 'fssaiEnabled',
  hsnEnabled: 'hsnEnabled',
  loyaltyPointRatio: 'loyaltyPointRatio',
  loyaltyMinRedeem: 'loyaltyMinRedeem',
  enableLoyaltyProgram: 'enableLoyaltyProgram',
  loyaltyMinOrderAmount: 'loyaltyMinOrderAmount',
  loyaltyValueInRupees: 'loyaltyValueInRupees',
  maxRedeemPointsPerBill: 'maxRedeemPointsPerBill',
  qrMenuShowDetails: 'qrMenuShowDetails',
  qrMenuCuisines: 'qrMenuCuisines',
  qrMenuRating: 'qrMenuRating',
  qrMenuDeliveryTime: 'qrMenuDeliveryTime',
  qrMenuCostForTwo: 'qrMenuCostForTwo',
  qrMenuPriceInclusive: 'qrMenuPriceInclusive',
  enableKOTWithBill: 'enableKOTWithBill',
  enableMenuQRInBill: 'enableMenuQRInBill',
  aiScraperEnabled: 'aiScraperEnabled',
  excelImportEnabled: 'excelImportEnabled',
  enableDeliveryCharges: 'enableDeliveryCharges',
  deliveryChargeAmount: 'deliveryChargeAmount',
  deliveryGstEnabled: 'deliveryGstEnabled',
  deliveryGstRate: 'deliveryGstRate',
  enablePackagingCharges: 'enablePackagingCharges',
  packagingChargeAmount: 'packagingChargeAmount',
  packagingGstEnabled: 'packagingGstEnabled',
  packagingGstRate: 'packagingGstRate',
  qrDeliveryChargeEnabled: 'qrDeliveryChargeEnabled',
  qrDeliveryChargeAmount: 'qrDeliveryChargeAmount',
  qrPackagingChargeEnabled: 'qrPackagingChargeEnabled',
  qrPackagingChargeAmount: 'qrPackagingChargeAmount',
  lastTokenNumber: 'lastTokenNumber',
  lastTokenDate: 'lastTokenDate',
  enableClerkAuth: 'enableClerkAuth',
  enableCustomAuth: 'enableCustomAuth',
  billCounter: 'billCounter',
  createdAt: 'createdAt',
  syncQuickPosWithKitchen: 'syncQuickPosWithKitchen',
  multiZoneMenuEnabled: 'multiZoneMenuEnabled',
  zones: 'zones',
  posCashEnabled: 'posCashEnabled',
  posUpiEnabled: 'posUpiEnabled',
  posCardEnabled: 'posCardEnabled',
  posCounterEnabled: 'posCounterEnabled',
  posWalletEnabled: 'posWalletEnabled',
  posHoldEnabled: 'posHoldEnabled',
  posSaveEnabled: 'posSaveEnabled',
  posPreviewEnabled: 'posPreviewEnabled',
  posKotEnabled: 'posKotEnabled',
  qrPayCashEnabled: 'qrPayCashEnabled',
  qrPayUpiEnabled: 'qrPayUpiEnabled',
  qrPayCardEnabled: 'qrPayCardEnabled',
  phonePrefixType: 'phonePrefixType',
  printSettings: 'printSettings',
  reviewUrl: 'reviewUrl',
  isOnline: 'isOnline',
  openingTime: 'openingTime',
  closingTime: 'closingTime',
  offlineMessage: 'offlineMessage',
  trialStartedAt: 'trialStartedAt',
  isPremium: 'isPremium',
  premiumEndDate: 'premiumEndDate',
  showPremiumPopup: 'showPremiumPopup',
  isFrozen: 'isFrozen',
  expiryTrackingEnabled: 'expiryTrackingEnabled',
  enableSerialNumber: 'enableSerialNumber',
  isStockCompulsory: 'isStockCompulsory',
  serialCounter: 'serialCounter',
  recycledCounters: 'recycledCounters',
  updatedAt: 'updatedAt'
};

exports.Prisma.ManualInvoiceScalarFieldEnum = {
  id: 'id',
  clerkUserId: 'clerkUserId',
  invoiceNumber: 'invoiceNumber',
  date: 'date',
  dueDate: 'dueDate',
  documentType: 'documentType',
  customerName: 'customerName',
  customerPhone: 'customerPhone',
  customerEmail: 'customerEmail',
  customerAddress: 'customerAddress',
  customerCity: 'customerCity',
  customerState: 'customerState',
  customerPincode: 'customerPincode',
  customerGst: 'customerGst',
  companyInfo: 'companyInfo',
  items: 'items',
  orderId: 'orderId',
  subtotal: 'subtotal',
  discount: 'discount',
  tax: 'tax',
  total: 'total',
  paymentMode: 'paymentMode',
  status: 'status',
  notes: 'notes',
  bankDetails: 'bankDetails',
  termsConditions: 'termsConditions',
  bankImage: 'bankImage',
  pdfUrl: 'pdfUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExpenseScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  amount: 'amount',
  category: 'category',
  description: 'description',
  date: 'date',
  paymentMode: 'paymentMode',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UploadScalarFieldEnum = {
  id: 'id',
  imageUrl: 'imageUrl',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.ActivityLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  meta: 'meta',
  createdAt: 'createdAt'
};

exports.Prisma.BillManagerScalarFieldEnum = {
  id: 'id',
  clerkUserId: 'clerkUserId',
  billNumber: 'billNumber',
  createdAt: 'createdAt',
  items: 'items',
  orderId: 'orderId',
  subtotal: 'subtotal',
  discountAmount: 'discountAmount',
  discountCode: 'discountCode',
  tax: 'tax',
  deliveryCharges: 'deliveryCharges',
  deliveryGst: 'deliveryGst',
  packagingCharges: 'packagingCharges',
  packagingGst: 'packagingGst',
  serviceCharge: 'serviceCharge',
  total: 'total',
  paymentMode: 'paymentMode',
  paymentStatus: 'paymentStatus',
  amountPaid: 'amountPaid',
  balanceDue: 'balanceDue',
  upiTxnRef: 'upiTxnRef',
  isHeld: 'isHeld',
  tokenNumber: 'tokenNumber',
  kotNumbers: 'kotNumbers',
  customerName: 'customerName',
  customerPhone: 'customerPhone',
  customerAddress: 'customerAddress',
  buyerGSTIN: 'buyerGSTIN',
  placeOfSupply: 'placeOfSupply',
  isKotPrinted: 'isKotPrinted',
  partyId: 'partyId',
  isDeleted: 'isDeleted',
  deletedAt: 'deletedAt',
  deletedSnapshot: 'deletedSnapshot',
  pdfUrl: 'pdfUrl',
  tableName: 'tableName',
  zoneName: 'zoneName',
  auditNote: 'auditNote',
  whatsappSent: 'whatsappSent',
  whatsappSentAt: 'whatsappSentAt',
  whatsappSid: 'whatsappSid',
  inventoryDeducted: 'inventoryDeducted',
  idempotencyKey: 'idempotencyKey'
};

exports.Prisma.ComboScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  price: 'price',
  imageUrl: 'imageUrl',
  clerkUserId: 'clerkUserId',
  isActive: 'isActive',
  selections: 'selections',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OfferScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  code: 'code',
  discountType: 'discountType',
  discountValue: 'discountValue',
  minOrderValue: 'minOrderValue',
  maxDiscount: 'maxDiscount',
  buyItemId: 'buyItemId',
  buyQty: 'buyQty',
  getItemOffId: 'getItemOffId',
  getQty: 'getQty',
  getDiscount: 'getDiscount',
  applyOnCategory: 'applyOnCategory',
  startDate: 'startDate',
  endDate: 'endDate',
  usageLimit: 'usageLimit',
  currentUsage: 'currentUsage',
  isActive: 'isActive',
  clerkUserId: 'clerkUserId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RewardScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  pointsRequired: 'pointsRequired',
  isActive: 'isActive',
  clerkUserId: 'clerkUserId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GalleryImageScalarFieldEnum = {
  id: 'id',
  clerkUserId: 'clerkUserId',
  imageUrl: 'imageUrl',
  category: 'category',
  caption: 'caption',
  sortOrder: 'sortOrder',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.BackupScalarFieldEnum = {
  id: 'id',
  filename: 'filename',
  fileSize: 'fileSize',
  s3Url: 's3Url',
  status: 'status',
  error: 'error',
  createdAt: 'createdAt'
};

exports.Prisma.StaffScalarFieldEnum = {
  id: 'id',
  name: 'name',
  phone: 'phone',
  email: 'email',
  password: 'password',
  accessType: 'accessType',
  permissions: 'permissions',
  businessId: 'businessId',
  status: 'status',
  publicMetadata: 'publicMetadata',
  privateMetadata: 'privateMetadata',
  unsafeMetadata: 'unsafeMetadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WalletTransactionScalarFieldEnum = {
  id: 'id',
  partyId: 'partyId',
  clerkId: 'clerkId',
  type: 'type',
  amount: 'amount',
  description: 'description',
  paymentProof: 'paymentProof',
  createdAt: 'createdAt'
};

exports.Prisma.ExpenseCategoryScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  color: 'color',
  icon: 'icon',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SubscriptionOrderScalarFieldEnum = {
  id: 'id',
  merchantOrderId: 'merchantOrderId',
  phonepeOrderId: 'phonepeOrderId',
  clerkUserId: 'clerkUserId',
  customer: 'customer',
  items: 'items',
  amount: 'amount',
  paymentStatus: 'paymentStatus',
  invoiceNumber: 'invoiceNumber',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SystemSettingsScalarFieldEnum = {
  id: 'id',
  defaultTrialDays: 'defaultTrialDays',
  appLatestVersion: 'appLatestVersion',
  appMinRequiredVersion: 'appMinRequiredVersion',
  appUpdateUrl: 'appUpdateUrl',
  appReleaseNotes: 'appReleaseNotes',
  updatedAt: 'updatedAt'
};

exports.Prisma.GmailConnectionScalarFieldEnum = {
  id: 'id',
  clerkUserId: 'clerkUserId',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  connectedEmail: 'connectedEmail',
  isConnected: 'isConnected',
  lastSynced: 'lastSynced',
  lastEmailId: 'lastEmailId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExternalSalesScalarFieldEnum = {
  id: 'id',
  clerkUserId: 'clerkUserId',
  date: 'date',
  platform: 'platform',
  totalOrders: 'totalOrders',
  totalRevenue: 'totalRevenue',
  cancelledOrders: 'cancelledOrders',
  avgOrderValue: 'avgOrderValue',
  rating: 'rating',
  sourceEmailId: 'sourceEmailId',
  parsedAt: 'parsedAt',
  rawSnippet: 'rawSnippet',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HotelRoomScalarFieldEnum = {
  id: 'id',
  clerkUserId: 'clerkUserId',
  roomNumber: 'roomNumber',
  roomType: 'roomType',
  floor: 'floor',
  pricePerNight: 'pricePerNight',
  status: 'status',
  isActive: 'isActive',
  amenities: 'amenities',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HotelBookingScalarFieldEnum = {
  id: 'id',
  clerkUserId: 'clerkUserId',
  stayId: 'stayId',
  roomNumber: 'roomNumber',
  roomId: 'roomId',
  customerName: 'customerName',
  customerPhone: 'customerPhone',
  customerEmail: 'customerEmail',
  gender: 'gender',
  idProofType: 'idProofType',
  idProofNumber: 'idProofNumber',
  customerAddress: 'customerAddress',
  city: 'city',
  entryTime: 'entryTime',
  exitTime: 'exitTime',
  actualCheckOutTime: 'actualCheckOutTime',
  adults: 'adults',
  children: 'children',
  pricePerNight: 'pricePerNight',
  roomCharges: 'roomCharges',
  extraCharges: 'extraCharges',
  discount: 'discount',
  taxAmount: 'taxAmount',
  totalAmount: 'totalAmount',
  advancePaid: 'advancePaid',
  balanceDue: 'balanceDue',
  paymentMode: 'paymentMode',
  status: 'status',
  remarks: 'remarks',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HotelPaymentScalarFieldEnum = {
  id: 'id',
  clerkUserId: 'clerkUserId',
  bookingId: 'bookingId',
  stayId: 'stayId',
  amount: 'amount',
  paymentMode: 'paymentMode',
  paymentType: 'paymentType',
  transactionId: 'transactionId',
  remarks: 'remarks',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GoogleReviewQRScalarFieldEnum = {
  id: 'id',
  code: 'code',
  businessProfileId: 'businessProfileId',
  shopName: 'shopName',
  destinationUrl: 'destinationUrl',
  scanCount: 'scanCount',
  lastScannedAt: 'lastScannedAt',
  createdAt: 'createdAt'
};

exports.Prisma.FuelBillScalarFieldEnum = {
  id: 'id',
  clerkUserId: 'clerkUserId',
  billNumber: 'billNumber',
  vehicleNo: 'vehicleNo',
  fuelType: 'fuelType',
  rate: 'rate',
  saleAmount: 'saleAmount',
  volume: 'volume',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};
exports.Role = exports.$Enums.Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SELLER: 'SELLER',
  MASTER: 'MASTER'
};

exports.FieldType = exports.$Enums.FieldType = {
  INPUT: 'INPUT',
  SELECT: 'SELECT',
  CHECKBOX: 'CHECKBOX',
  RADIO: 'RADIO',
  FILE: 'FILE'
};

exports.Prisma.ModelName = {
  RolePermission: 'RolePermission',
  Category: 'Category',
  Item: 'Item',
  RawMaterial: 'RawMaterial',
  RecipeItem: 'RecipeItem',
  AddonGroup: 'AddonGroup',
  Party: 'Party',
  Payment: 'Payment',
  User: 'User',
  UserSession: 'UserSession',
  Table: 'Table',
  Order: 'Order',
  Review: 'Review',
  Form: 'Form',
  Field: 'Field',
  BusinessProfile: 'BusinessProfile',
  ManualInvoice: 'ManualInvoice',
  Expense: 'Expense',
  Upload: 'Upload',
  ActivityLog: 'ActivityLog',
  BillManager: 'BillManager',
  Combo: 'Combo',
  Offer: 'Offer',
  Reward: 'Reward',
  GalleryImage: 'GalleryImage',
  Backup: 'Backup',
  Staff: 'Staff',
  WalletTransaction: 'WalletTransaction',
  ExpenseCategory: 'ExpenseCategory',
  SubscriptionOrder: 'SubscriptionOrder',
  SystemSettings: 'SystemSettings',
  GmailConnection: 'GmailConnection',
  ExternalSales: 'ExternalSales',
  HotelRoom: 'HotelRoom',
  HotelBooking: 'HotelBooking',
  HotelPayment: 'HotelPayment',
  GoogleReviewQR: 'GoogleReviewQR',
  FuelBill: 'FuelBill'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
