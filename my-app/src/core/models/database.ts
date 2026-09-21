import type { RowDataPacket } from "mysql2";

export type TemplateListRow = RowDataPacket & { id: number; c_name: string; is_active?: number | string | boolean | null };

export type ActiveColumnRow = RowDataPacket & { column_name: string; column_type: string };

export type TemplateRow = RowDataPacket & {
  id: number;
  c_name: string;
  inside: string | null;
  outside: string | null;
};

export type EmployeeRow = RowDataPacket & { fs_id: string };

export type EmployeeOptionRow = RowDataPacket & {
  fs_id: string | number | null;
  emp_name: string | null;
};

export type EmployeeLocationRow = RowDataPacket & { location_emp: string | null };

export type EmployeeReportAccessRow = RowDataPacket & {
  section: string | number | null;
  location_emp: string | null;
};

export type ActionLogRow = RowDataPacket & {
  Logid: number;
  empId: string;
  createdDate: Date | string;
  action: string;
};

export type TbhUserRow = RowDataPacket & {
  userInv: string;
  passwordInv: string;
  fs_id: string | number | null;
};

export type AdminRole = "admin" | "super_admin";

export type AdminRow = RowDataPacket & {
  idUser: number;
  fs_id: string | number;
  role: AdminRole | string;
  createdDate: Date | string | null;
  emp_name?: string | null;
};
