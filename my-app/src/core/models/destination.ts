export type DestinationItem = {
  id: string;
  value: string;
};

export type DestinationsPageState = {
  destinations: DestinationItem[];
  value: string;
  editingId: string;
  deleteTarget: DestinationItem | null;
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  checkingAccess: boolean;
  isAdmin: boolean;
  message: string;
  error: string;
};

export type DestinationFormProps = {
  value: string;
  isEditing: boolean;
  saving: boolean;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
};

export type DestinationTableProps = {
  destinations: DestinationItem[];
  loading: boolean;
  onEdit: (destination: DestinationItem) => void;
  onDelete: (destination: DestinationItem) => void;
};

export type DestinationDeleteModalProps = {
  target: DestinationItem | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};
