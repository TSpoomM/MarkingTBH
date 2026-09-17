export type AdminAccess = {
  userId: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: "admin" | "super_admin" | null;
  isBranchManager: boolean;
  branch: string | null;
  canManageAdmins: boolean;
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
