import type { RowDataPacket } from "mysql2";

export type CustomerRow = RowDataPacket & { c_id: number; c_name: string; is_active?: number | string | boolean | null };

export type ActiveColumnRow = RowDataPacket & { column_name: string; column_type: string };

export type TemplateRow = RowDataPacket & {
  id: number;
  c_id: number;
  inside: string | null;
  outside: string | null;
};

export type EmployeeRow = RowDataPacket & { fs_id: string };

export type EmployeeLocationRow = RowDataPacket & { location_emp: string | null };

export type EmployeeRoleRow = RowDataPacket & {
  position: string | null;
};

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
