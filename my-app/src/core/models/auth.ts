export type AdminAccess = {
  userId: string;
  isAdmin: boolean;
  isBranchManager: boolean;
  branch: string | null;
  canAccessReport: boolean;
};

export type HrkpisSession = {
  userId: string;
  empId: string;
  userInv: string;
  imgProfile?: string;
  yearAssessment?: string;
};

export type PhpValue = string | number | boolean | null | PhpValueRecord;

export interface PhpValueRecord {
  [key: string]: PhpValue;
}
