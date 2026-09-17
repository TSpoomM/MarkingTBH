"use client";

import { Component, type FormEvent } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import Autocomplete from "@/src/components/ui/Autocomplete";
import Button from "@/src/components/ui/Button";
import Modal from "@/src/components/ui/Modal";
import Select from "@/src/components/ui/Select";
import { CONTAINER, PANEL, TABLE_HEADING } from "@/src/core/ui/surfaces";
import { HISTORY_EMPTY, HISTORY_ROW, HISTORY_TABLE, HISTORY_TABLE_WRAP } from "@/src/core/ui/history";
import { httpService } from "@/src/core/services/http.service";
import { sessionApiService } from "@/src/core/services/session-api.service";

type AdminRole = "admin" | "super_admin";

type AdminUser = {
  idUser: number;
  fsId: string;
  name: string;
  role: AdminRole;
  createdDate: string | null;
};

type EmployeeOption = {
  fsId: string;
  name: string;
};

type AdminPageState = {
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

const INITIAL_STATE: AdminPageState = {
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

export default class AdminsPage extends Component<object, AdminPageState> {
  state = { ...INITIAL_STATE };
  private isMounted = false;

  componentDidMount() {
    this.isMounted = true;
    void this.bootstrap();
  }

  componentWillUnmount() {
    this.isMounted = false;
  }

  private async bootstrap() {
    const isSuperAdmin = await sessionApiService.isSuperAdmin();
    if (!this.isMounted) return;
    this.setState({ isSuperAdmin, checkingAccess: false });
    if (isSuperAdmin) await Promise.all([this.loadAdmins(), this.loadEmployees()]);
    else this.setState({ loading: false });
  }

  private async loadAdmins() {
    this.setState({ loading: true, error: "" });
    try {
      const admins = await httpService.data<AdminUser[]>("/api/admins");
      if (this.isMounted) this.setState({ admins, loading: false });
    } catch (error) {
      if (this.isMounted) this.setState({ error: error instanceof Error ? error.message : "Load failed", loading: false });
    }
  }

  private async loadEmployees() {
    try {
      const employees = await httpService.data<EmployeeOption[]>("/api/employees");
      if (this.isMounted) this.setState({ employees });
    } catch (error) {
      if (this.isMounted) this.setState({ error: error instanceof Error ? error.message : "Load employees failed" });
    }
  }

  private handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fsId = this.state.selectedFsId.trim();
    if (!fsId) {
      this.setState({ error: "กรุณาเลือกชื่อพนักงานจากรายการ", message: "" });
      return;
    }

    this.setState({ saving: true, error: "", message: "" });
    try {
      await httpService.postJson<AdminUser>("/api/admins", {
        fsId,
        role: this.state.role,
      });
      if (!this.isMounted) return;
      this.setState({
        employeeQuery: "",
        selectedFsId: "",
        role: "admin",
        editingAdminId: null,
        saving: false,
        message: "บันทึก admin เรียบร้อยแล้ว",
      });
      await this.loadAdmins();
    } catch (error) {
      if (this.isMounted) {
        this.setState({ error: error instanceof Error ? error.message : "Save failed", saving: false });
      }
    }
  };

  private handleEdit = (admin: AdminUser) => {
    this.setState({
      editingAdminId: admin.idUser,
      employeeQuery: admin.name,
      selectedFsId: admin.fsId,
      role: admin.role,
      error: "",
      message: "",
    });
  };

  private cancelEdit = () => {
    this.setState({
      editingAdminId: null,
      employeeQuery: "",
      selectedFsId: "",
      role: "admin",
      error: "",
      message: "",
    });
  };

  private closeDeleteModal = () => {
    if (this.state.deleting) return;
    this.setState({ deleteTarget: null });
  };

  private confirmDelete = async () => {
    const target = this.state.deleteTarget;
    if (!target) return;

    this.setState({ deleting: true, error: "", message: "" });
    try {
      await httpService.json("/api/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idUser: target.idUser }),
      });
      if (!this.isMounted) return;
      this.setState({
        deleteTarget: null,
        deleting: false,
        editingAdminId: this.state.editingAdminId === target.idUser ? null : this.state.editingAdminId,
        employeeQuery: this.state.editingAdminId === target.idUser ? "" : this.state.employeeQuery,
        selectedFsId: this.state.editingAdminId === target.idUser ? "" : this.state.selectedFsId,
        role: this.state.editingAdminId === target.idUser ? "admin" : this.state.role,
        message: "ลบ admin เรียบร้อยแล้ว",
      });
      await this.loadAdmins();
    } catch (error) {
      if (this.isMounted) {
        this.setState({ error: error instanceof Error ? error.message : "Delete failed", deleting: false });
      }
    }
  };

  render() {
    const {
      admins, checkingAccess, deleting, deleteTarget, editingAdminId, employees, employeeQuery,
      error, isSuperAdmin, loading, message, role, saving,
    } = this.state;
    const employeeOptions = employees.map((employee) => ({ value: employee.fsId, label: employee.name }));

    if (checkingAccess) {
      return <main className={CONTAINER}>กำลังตรวจสอบสิทธิ์...</main>;
    }

    if (!isSuperAdmin) {
      return (
        <main className={CONTAINER}>
          <section className={PANEL + " p-6 text-sm font-semibold text-[#8a3b3b]"}>
            เฉพาะ Super Admin เท่านั้น
          </section>
        </main>
      );
    }

    return (
      <main className={CONTAINER}>
        <section className={TABLE_HEADING}>
          <div>
            <h2 className="m-0 text-xl font-black text-[#10231d]">Admins</h2>
            <p className="m-0 mt-1 text-sm font-semibold text-[#60736b]">จัดการสิทธิ์ admin</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => void this.loadAdmins()} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </Button>
        </section>

        <form className={PANEL + " grid gap-4 p-5"} onSubmit={this.handleSubmit}>
          <div className="grid grid-cols-[minmax(260px,1fr)_180px_120px] items-end gap-3 max-bp900:grid-cols-1">
            <Autocomplete
              label="ชื่อพนักงาน"
              value={employeeQuery}
              options={employeeOptions}
              maxOptions={30}
              disabled={editingAdminId !== null}
              onChange={(event) => this.setState({
                employeeQuery: event.currentTarget.value,
                selectedFsId: "",
                error: "",
                message: "",
              })}
              onSelectOption={(option) => this.setState({
                employeeQuery: option.label,
                selectedFsId: option.value,
                error: "",
                message: "",
              })}
              required
            />
            <Select
              label="role"
              value={role}
              onChange={(event) => this.setState({ role: event.currentTarget.value as AdminRole, error: "", message: "" })}
            >
              <option value="admin">admin</option>
              <option value="super_admin">super_admin</option>
            </Select>
            <div className="grid gap-2">
              <span className="invisible text-sm font-extrabold">Save</span>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="h-[45px] min-h-[45px] w-full"
                loading={saving}
                loadingText="Saving..."
              >
                <Plus size={16} aria-hidden="true" />
                {editingAdminId === null ? "Save" : "Update"}
              </Button>
              <small className="invisible text-[14px] leading-[1.4]">.</small>
            </div>
          </div>
          {editingAdminId !== null && (
            <div className="flex justify-end">
              <Button type="button" variant="secondary" size="md" onClick={this.cancelEdit}>
                ยกเลิกแก้ไข
              </Button>
            </div>
          )}
          {message && <p className="m-0 rounded-lg bg-[#eaf7f1] px-3 py-2 text-sm font-semibold text-primary-dark">{message}</p>}
          {error && <p className="m-0 rounded-lg bg-[#fff0f0] px-3 py-2 text-sm font-semibold text-[#9d3434]">{error}</p>}
        </form>

        <section className={PANEL + " overflow-hidden"}>
          {loading ? (
            <div className={HISTORY_EMPTY}>Loading...</div>
          ) : admins.length === 0 ? (
            <div className={HISTORY_EMPTY}>ไม่พบรายชื่อ admin</div>
          ) : (
            <div className={HISTORY_TABLE_WRAP}>
              <table className={HISTORY_TABLE}>
                <colgroup>
                  <col className="w-[25%]" />
                  <col className="w-[25%]" />
                  <col className="w-[25%]" />
                  <col className="w-[25%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th>ชื่อ</th>
                    <th>role</th>
                    <th>createdDate</th>
                    <th>แก้ไข</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr className={HISTORY_ROW} key={admin.idUser || admin.fsId}>
                      <td>{admin.name}</td>
                      <td>{admin.role}</td>
                      <td>{admin.createdDate || "-"}</td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            className="min-h-[38px] px-3"
                            onClick={() => this.handleEdit(admin)}
                          >
                            <Pencil size={15} aria-hidden="true" />
                            แก้ไข
                          </Button>
                          <Button
                            type="button"
                            variant="alert"
                            size="md"
                            className="min-h-[38px] px-3"
                            onClick={() => this.setState({ deleteTarget: admin, error: "", message: "" })}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                            ลบ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <Modal
          open={deleteTarget !== null}
          title="ยืนยันการลบ"
          subtitle={deleteTarget ? `ต้องการลบสิทธิ์ admin ของ ${deleteTarget.name} ใช่ไหม` : undefined}
          className="!w-[min(520px,calc(100vw-32px))]"
          onClose={this.closeDeleteModal}
          footer={(
            <>
              <Button type="button" variant="secondary" onClick={this.closeDeleteModal} disabled={deleting}>
                ยกเลิก
              </Button>
              <Button type="button" variant="alert" loading={deleting} loadingText="กำลังลบ..." onClick={() => void this.confirmDelete()}>
                <Trash2 size={16} aria-hidden="true" />
                ลบ
              </Button>
            </>
          )}
        >
          <div className="bg-white p-5 text-sm font-semibold leading-6 text-[#24352d]">
            การลบนี้จะถอดสิทธิ์ admin ทันที
          </div>
        </Modal>
      </main>
    );
  }
}
