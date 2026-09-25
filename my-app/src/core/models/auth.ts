export type AdminAccess = {
  userId: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: "admin" | "super_admin" | null;
  canManageAdmins: boolean;
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
