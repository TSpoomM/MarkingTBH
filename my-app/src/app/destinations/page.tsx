"use client";

import { Component, type FormEvent } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import Modal from "@/src/components/ui/Modal";
import Toast from "@/src/components/ui/Toast";
import { CONTAINER, PANEL, TABLE_HEADING } from "@/src/core/ui/surfaces";
import { HISTORY_EMPTY, HISTORY_ROW, HISTORY_TABLE, HISTORY_TABLE_WRAP } from "@/src/core/ui/history";
import { httpService } from "@/src/core/services/http.service";
import { sessionApiService } from "@/src/core/services/session-api.service";

type DestinationItem = {
  id: string;
  value: string;
};

type DestinationsPageState = {
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

const INITIAL_STATE: DestinationsPageState = {
  destinations: [],
  value: "",
  editingId: "",
  deleteTarget: null,
  loading: true,
  saving: false,
  deleting: false,
  checkingAccess: true,
  isAdmin: false,
  message: "",
  error: "",
};

export default class DestinationsPage extends Component<object, DestinationsPageState> {
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
    const isAdmin = await sessionApiService.isAdmin();
    if (!this.isMounted) return;
    this.setState({ isAdmin, checkingAccess: false });
    if (isAdmin) await this.loadDestinations();
    else this.setState({ loading: false });
  }

  private async loadDestinations() {
    this.setState({ loading: true, error: "" });
    try {
      const destinations = await httpService.data<DestinationItem[]>("/api/destinations?manage=1");
      if (this.isMounted) this.setState({ destinations, loading: false });
    } catch (error) {
      if (this.isMounted) {
        this.setState({ error: error instanceof Error ? error.message : "Load failed", loading: false });
      }
    }
  }

  private resetForm(message = "") {
    this.setState({ value: "", editingId: "", saving: false, message });
  }

  private normalizeDestination(value: string) {
    return value.toLocaleUpperCase("en-US");
  }

  private handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = this.normalizeDestination(this.state.value).trim();
    if (!value) {
      this.setState({ error: "กรุณากรอก destination", message: "" });
      return;
    }

    this.setState({ saving: true, error: "", message: "" });
    try {
      if (this.state.editingId) {
        await httpService.putJson<DestinationItem>("/api/destinations", { id: this.state.editingId, value });
      } else {
        await httpService.postJson<DestinationItem>("/api/destinations", { value });
      }
      if (!this.isMounted) return;
      this.resetForm("บันทึก destination เรียบร้อยแล้ว");
      await this.loadDestinations();
    } catch (error) {
      if (this.isMounted) {
        this.setState({ error: error instanceof Error ? error.message : "Save failed", saving: false });
      }
    }
  };

  private handleEdit(destination: DestinationItem) {
    this.setState({
      editingId: destination.id,
      value: destination.value,
      error: "",
      message: "",
    });
  }

  private cancelEdit = () => {
    this.setState({ editingId: "", value: "", error: "", message: "" });
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
      await httpService.json("/api/destinations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: target.id }),
      });
      if (!this.isMounted) return;
      this.setState({
        deleteTarget: null,
        deleting: false,
        editingId: this.state.editingId === target.id ? "" : this.state.editingId,
        value: this.state.editingId === target.id ? "" : this.state.value,
        message: "ลบ destination เรียบร้อยแล้ว",
      });
      await this.loadDestinations();
    } catch (error) {
      if (this.isMounted) {
        this.setState({ error: error instanceof Error ? error.message : "Delete failed", deleting: false });
      }
    }
  };

  render() {
    const {
      checkingAccess, deleteTarget, deleting, destinations, editingId, error,
      isAdmin, loading, message, saving, value,
    } = this.state;

    if (checkingAccess) {
      return <main className={CONTAINER}>กำลังตรวจสอบสิทธิ์...</main>;
    }

    if (!isAdmin) {
      return (
        <main className={CONTAINER}>
          <section className={PANEL + " p-6 text-sm font-semibold text-[#8a3b3b]"}>
            เฉพาะ Admin ขึ้นไปเท่านั้น
          </section>
        </main>
      );
    }

    return (
      <main className={CONTAINER}>
        {message && <Toast type="success" message={message} onClose={() => this.setState({ message: "" })} />}
        {error && <Toast type="error" message={error} onClose={() => this.setState({ error: "" })} />}

        <section className={TABLE_HEADING}>
          <div>
            <h2 className="m-0 text-xl font-black text-[#10231d]">Destinations</h2>
            <p className="m-0 mt-1 text-sm font-semibold text-[#60736b]">จัดการปลายทางที่ใช้ใน autocomplete</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => void this.loadDestinations()} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </Button>
        </section>

        <form className={PANEL + " grid gap-4 p-5"} onSubmit={this.handleSubmit}>
          <div className="grid grid-cols-[minmax(260px,1fr)_120px] items-end gap-3 max-bp700:grid-cols-1">
            <Input
              label="Destination"
              value={value}
              onChange={(event) => this.setState({
                value: this.normalizeDestination(event.currentTarget.value),
                error: "",
                message: "",
              })}
              className="uppercase"
              placeholder="กรอก destination"
              required
            />
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
                {editingId ? "Update" : "Save"}
              </Button>
              <small className="invisible text-[14px] leading-[1.4]">.</small>
            </div>
          </div>
          {editingId && (
            <div className="flex justify-end">
              <Button type="button" variant="secondary" size="md" onClick={this.cancelEdit}>
                ยกเลิกแก้ไข
              </Button>
            </div>
          )}
        </form>

        <section className={PANEL + " overflow-hidden"}>
          {loading ? (
            <div className={HISTORY_EMPTY}>Loading...</div>
          ) : destinations.length === 0 ? (
            <div className={HISTORY_EMPTY}>ไม่พบ destination</div>
          ) : (
            <div className={HISTORY_TABLE_WRAP}>
              <table className={HISTORY_TABLE}>
                <colgroup>
                  <col className="w-[70%]" />
                  <col className="w-[30%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Destination</th>
                    <th>แก้ไข</th>
                  </tr>
                </thead>
                <tbody>
                  {destinations.map((destination, index) => (
                    <tr className={HISTORY_ROW} key={`${destination.id}-${index}`}>
                      <td>{destination.value}</td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            className="min-h-[38px] px-3"
                            onClick={() => this.handleEdit(destination)}
                          >
                            <Pencil size={15} aria-hidden="true" />
                            แก้ไข
                          </Button>
                          <Button
                            type="button"
                            variant="alert"
                            size="md"
                            className="min-h-[38px] px-3"
                            onClick={() => this.setState({ deleteTarget: destination, error: "", message: "" })}
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
          subtitle={deleteTarget ? `ต้องการลบ destination "${deleteTarget.value}" ใช่ไหม` : undefined}
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
            รายการนี้จะหายจาก autocomplete ของ DESTINATION ทันที
          </div>
        </Modal>
      </main>
    );
  }
}
