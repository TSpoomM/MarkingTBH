import type { AdminRole } from "@/src/core/models/database";

export type { AdminRole };

export type AdminUser = {
  idUser: number;
  fsId: string;
  name: string;
  role: AdminRole;
  createdDate: string | null;
};

export type EmployeeOption = {
  fsId: string;
  name: string;
};

export type AdminPageState = {
  admins: AdminUser[];
  employees: EmployeeOption[];
  employeeQuery: string;
  selectedFsId: string;
  role: AdminRole;
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  isSuperAdmin: boolean;
  checkingAccess: boolean;
  editingAdminId: number | null;
  deleteTarget: AdminUser | null;
  message: string;
  error: string;
};

export type AdminFormProps = {
  employees: EmployeeOption[];
  employeeQuery: string;
  role: AdminRole;
  isEditing: boolean;
  saving: boolean;
  onEmployeeQueryChange: (query: string) => void;
  onEmployeeSelect: (employee: EmployeeOption) => void;
  onRoleChange: (role: AdminRole) => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
};

export type AdminTableProps = {
  admins: AdminUser[];
  loading: boolean;
  onEdit: (admin: AdminUser) => void;
  onDelete: (admin: AdminUser) => void;
};

export type AdminDeleteModalProps = {
  target: AdminUser | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};
