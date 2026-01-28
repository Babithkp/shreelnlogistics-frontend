export type Section =
  | "dashboard"
  | "LR"
  | "FM"
  | "Bill"
  | "outstanding"
  | "branch"
  | "expenses"
  | "statements"
  | "vendor"
  | "client"
  | "pod"
  | "reports"
  | "settings";
export type SectionsState = Record<Section, boolean>;

export type Notification = {
  id: string;
  requestId: string;
  title: string;
  description: string;
  status: string;
  data: any;
  message: string;
  fileId: string;
  adminId: string;
  branchesId: string;
  createdAt: string;
};

export interface LrInputs {
  id: string;
  lrNumber: string;
  date: string;
  from: string;
  to: string;
  insurance: string;
  consignorName: string;
  consignorGSTIN: string;
  consignorPincode: string;
  consignorAddress: string;
  consigneeName: string;
  consigneeGSTIN: string;
  consigneeGSTIN_1: string;
  consigneePincode: string;
  consigneeAddress: string;
  noOfPackages: string;
  methodOfPacking: string;
  description: string;
  invoiceNo: string;
  invoiceDate: string;
  value: string;
  weight: string;
  sizeL: string;
  sizeW: string;
  sizeH: string;
  ftl: string;
  paymentType: string;
  freightCharges: string;
  hamali: string;
  surcharge: string;
  stCh: string;
  riskCh: string;
  unLoading: string;
  extraKms: string;
  detention: string;
  weightment: string;
  others: string;
  ewbNumber: string;
  ewbExpiryDate: string;
  totalAmt: number;
  adminId: string;
  branchId: string;
  emails: String[];
  vehicleId: string;
  branch: BranchInputs;
  client: ClientInputs;
  billId: string;
  Vehicle: {
    id: string;
    vehicleNumber: string;
    vehicletypes: string;
    driverName: string;
    driverPhone: string;
    vendorName: string;
  };
}

export interface FMInputs {
  id: string;
  fmNumber: string;
  date: string;
  from: string;
  to: string;
  vehicleNo: string;
  vehicleType: string;
  weight: string;
  package: string;
  payableAt: string;
  vendorName: string;
  vendorEmail: string;
  ContactPerson: string;
  DriverName: string;
  contactNumber: string;
  ownerName: string;
  TDS: string;
  insturance: string;
  Rc: string;
  createdAt: string;
  LRDetails: {
    lrNumber: string;
    date: string;
    status: string;
  }[];
  hire: string;
  advance: string;
  balance: string;
  otherCharges: string;
  detentionCharges: string;
  rtoCharges: string;
  tds: string;
  netBalance: string;
  driverSignature: string;
  dlNumber: string;
  status: string;
  amountInwords: string;
  zeroToThirty: string;
  thirtyToSixty: string;
  sixtyToNinety: string;
  ninetyPlus: string;
  outStandingBalance: string;
  outStandingAdvance: number;
  emails: string[];
  PaymentRecords: PaymentRecord[];
  vendorsId: string;
  branchId: string;
  adminId: string;
  branch: BranchInputs;
  currentOutStanding: number;
  sizeL: string;
  sizeW: string;
  sizeH: string;
  ftl: string;
  WriteOff: WriteOffInputs;
}

export interface PaymentRecord {
  id: string;
  IDNumber: string;
  date: string;
  customerName: string;
  amount: string;
  amountInWords: string;
  pendingAmount: number;
  pendingAmountInWords: string;
  transactionNumber: string;
  paymentMode: string;
  remarks: string;
  branchId: string;
  adminId: string;
  clientId: string;
}

export type VendorInputs = {
  id: string;
  name: string;
  GSTIN: string;
  branchName: string;
  contactPerson: string;
  contactNumber: string;
  pincode: string;
  address: string;
  TDS: string;
  email: string;
  city: string;
  state: string;
  outstandingLimit: number;
  currentOutStanding: number;
  vehicles: VehicleInputs[];
  FM: FMInputs[];
  pan: string;
};

export type VehicleInputs = {
  id: string;
  vendorName: string;
  vehicletypes: string;
  vehicleNumber: string;
  ownerName: string;
  ownerPhone: string;
  driverName: string;
  driverPhone: string;
  insurance: string;
  panNumber: string;
  RC: string;
  LR: LrInputs[];
};

export interface generalSettings {
  id: string;
  expenseTypes: string[];
  vehicleTypes: string[];
}

export type ClientInputs = {
  id: string;
  name: string;
  GSTIN: string;
  branchName: string;
  contactPerson: string;
  email: string;
  contactNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  panNumber: string;
  creditLimit: string;
  createdAt: string;
  pendingPayment: string;
  bill: billInputs[];
  LR: LrInputs[];
};

export interface billInputs {
  id: string;
  billNumber: string;
  tds: number;
  date: string;
  dueDate: string;
  hsnSacCode: string;
  placeOfSupply: string;
  mailBody: string;
  state: string;
  statecode: string;
  lrData: LrInputs[];
  igstRate: number;
  cgstRate: number;
  sgstRate: number;
  subTotal: number;
  total: number;
  totalInWords: string;
  billedIn: string;
  clientName: string;
  PaymentRecords: PaymentRecord[];
  pendingAmount: number;
  zeroToThirty: string;
  thirtyToSixty: string;
  sixtyPlus: string;
  createdAt: string;
  adminId: string;
  branchId: string;
  branchesId: string;
  isAdmin: boolean;
  Client: {
    id: string;
    name: string;
    GSTIN: string;
    address: string;
    email: string;
  };
  unloading: {
    state: boolean;
    lrnumber: string;
    amount: number;
  };
  hamali: {
    state: boolean;
    lrnumber: string;
    amount: number;
  };
  extraKmWeight: {
    state: boolean;
    lrnumber: string;
    amount: number;
  };
  detention: {
    state: boolean;
    lrnumber: string;
    amount: number;
  };
  weightment: {
    state: boolean;
    weight: string;
    lrnumber: string;
    amount: number;
  };
  others: {
    state: boolean;
    lrnumber: string;
    amount: number;
  };
  otherCharges: {
    state: boolean;
    name: string;
    lrnumber: string;
    amount: number;
  };
  Branches: BranchInputs;
  Admin: BranchInputs;
  WriteOff: WriteOffInputs;
}

export type BranchInputs = {
  id: string;
  branchName: string;
  branchManager: string;
  contactNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  username: string;
  password: string;
  employeeCount: string;
  totalBillingValue: string;
  email: string;
  PaymentRecords: PaymentRecord[];
  bill: billInputs[];
  FM: FMInputs[];
};

export interface ExpensesInputs {
  id: string;
  expenseId: string;
  description: string;
  date: string;
  category: string;
  customerName: string;
  linkTo: string;
  billNumber: string;
  fmNumber: string;
  amount: string;
  amountInWords: string;
  paymentType: string;
  transactionNumber: string;
  title: string;
  branchesId: string;
  adminId: string;
  Branches: {
    branchName: string;
  };
  Admin: {
    branchName: string;
  };
}
export interface CreditInputs {
  id: string;
  creditId: string;
  description: string;
  date: string;
  category: string;
  customerName: string;
  linkTo: string;
  billNumber: string;
  fmNumber: string;
  amount: string;
  amountInWords: string;
  paymentType: string;
  transactionNumber: string;
  title: string;
  branchesId: string;
  adminId: string;
  Branches: {
    branchName: string;
  };
  Admin: {
    branchName: string;
  };
}

export interface BulkRecord {
  id: string;
  vendorName: string;
  date: string;
  transactionNumber: string;
  paymentMode: string;
  remarks: string;
}

export interface WriteOffInputs {
  id: string;
  vendorName: string;
  date: string;
  IDNumber: string;
  amount: string;
  reason: string;
  checked: boolean;
}