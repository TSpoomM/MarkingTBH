import Store from "@/src/core/store/store";
import { adminApiService, AdminApiService } from "@/src/core/services/client/admin-api.service";
import { sessionApiService, SessionApiService } from "@/src/core/services/client/session-api.service";
import type { AdminPageState, AdminRole, AdminUser, EmployeeOption } from "@/src/core/models/admin";

const INITIAL_ADMINS_STATE: AdminPageState = {
  admins: [],
  employees: [],
  employeeQuery: "",
  selectedFsId: "",
  role: "admin",
  loading: true,
  saving: false,
  deleting: false,
  isSuperAdmin: false,
  checkingAccess: true,
  editingAdminId: null,
  deleteTarget: null,
  message: "",
  error: "",
};

/** Form fields restored to their empty defaults after a save, cancel, or delete of the edited row. */
const EMPTY_ADMIN_FORM: Pick<AdminPageState, "employeeQuery" | "selectedFsId" | "role" | "editingAdminId"> = {
  employeeQuery: "",
  selectedFsId: "",
  role: "admin",
  editingAdminId: null,
};

export class AdminsController extends Store<AdminPageState> {
  constructor(
    private readonly service: AdminApiService,
    private readonly session: SessionApiService,
  ) {
    super({ ...INITIAL_ADMINS_STATE });
  }

  protected async load() {
    const isSuperAdmin = await this.session.isSuperAdmin();
    this.setState({ isSuperAdmin, checkingAccess: false });
    if (isSuperAdmin) await Promise.all([this.loadAdmins(), this.loadEmployees()]);
    else this.setState({ loading: false });
  }

  /** Reopening the page starts from a clean form and re-checks access, as a first visit does. */
  protected async refresh() {
    this.setState({ ...INITIAL_ADMINS_STATE });
    await this.load();
  }

  loadAdmins = async () => {
    this.setState({ loading: true, error: "" });
    try {
      const admins = await this.service.list();
      this.setState({ admins, loading: false });
    } catch (error) {
      this.setState({ error: error instanceof Error ? error.message : "Load failed", loading: false });
    }
  };

  private async loadEmployees() {
    try {
      const employees = await this.service.listEmployees();
      this.setState({ employees });
    } catch (error) {
      this.setState({ error: error instanceof Error ? error.message : "Load employees failed" });
    }
  }

  setEmployeeQuery = (employeeQuery: string) => {
    this.setState({ employeeQuery, selectedFsId: "", error: "", message: "" });
  };

  selectEmployee = (employee: EmployeeOption) => {
    this.setState({ employeeQuery: employee.name, selectedFsId: employee.fsId, error: "", message: "" });
  };

  setRole = (role: AdminRole) => this.setState({ role, error: "", message: "" });

  submit = async () => {
    const fsId = this.state.selectedFsId.trim();
    if (!fsId) {
      this.setState({ error: "กรุณาเลือกชื่อพนักงานจากรายการ", message: "" });
      return;
    }

    this.setState({ saving: true, error: "", message: "" });
    try {
      await this.service.save(fsId, this.state.role);
      this.setState({ ...EMPTY_ADMIN_FORM, saving: false, message: "บันทึก admin เรียบร้อยแล้ว" });
      await this.loadAdmins();
    } catch (error) {
      this.setState({ error: error instanceof Error ? error.message : "Save failed", saving: false });
    }
  };

  startEdit = (admin: AdminUser) => {
    this.setState({
      editingAdminId: admin.idUser,
      employeeQuery: admin.name,
      selectedFsId: admin.fsId,
      role: admin.role,
      error: "",
      message: "",
    });
  };

  cancelEdit = () => this.setState({ ...EMPTY_ADMIN_FORM, error: "", message: "" });

  requestDelete = (deleteTarget: AdminUser) => this.setState({ deleteTarget, error: "", message: "" });

  closeDeleteModal = () => {
    if (this.state.deleting) return;
    this.setState({ deleteTarget: null });
  };

  confirmDelete = async () => {
    const target = this.state.deleteTarget;
    if (!target) return;

    this.setState({ deleting: true, error: "", message: "" });
    try {
      await this.service.remove(target.idUser);
      const wasEditing = this.state.editingAdminId === target.idUser;
      this.setState({
        ...(wasEditing ? EMPTY_ADMIN_FORM : {}),
        deleteTarget: null,
        deleting: false,
        message: "ลบ admin เรียบร้อยแล้ว",
      });
      await this.loadAdmins();
    } catch (error) {
      this.setState({ error: error instanceof Error ? error.message : "Delete failed", deleting: false });
    }
  };

  dismissMessage = () => this.setState({ message: "" });
  dismissError = () => this.setState({ error: "" });
}

export const adminsStore = new AdminsController(adminApiService, sessionApiService);
