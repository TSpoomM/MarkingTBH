import Store from "@/src/core/store/store";
import { destinationApiService, DestinationApiService } from "@/src/core/services/client/destination-api.service";
import { sessionApiService, SessionApiService } from "@/src/core/services/client/session-api.service";
import type { DestinationItem, DestinationsPageState } from "@/src/core/models/destination";

const INITIAL_DESTINATIONS_STATE: DestinationsPageState = {
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

export class DestinationsController extends Store<DestinationsPageState> {
  constructor(
    private readonly service: DestinationApiService,
    private readonly session: SessionApiService,
  ) {
    super({ ...INITIAL_DESTINATIONS_STATE });
  }

  protected async load() {
    const isAdmin = await this.session.isAdmin();
    this.setState({ isAdmin, checkingAccess: false });
    if (isAdmin) await this.loadDestinations();
    else this.setState({ loading: false });
  }

  /** Reopening the page starts from a clean form and re-checks access, as a first visit does. */
  protected async refresh() {
    this.setState({ ...INITIAL_DESTINATIONS_STATE });
    await this.load();
  }

  loadDestinations = async () => {
    this.setState({ loading: true, error: "" });
    try {
      const destinations = await this.service.list();
      this.setState({ destinations, loading: false });
    } catch (error) {
      this.setState({ error: error instanceof Error ? error.message : "Load failed", loading: false });
    }
  };

  private normalizeDestination(value: string) {
    return value.toLocaleUpperCase("en-US");
  }

  setValue = (value: string) => {
    this.setState({ value: this.normalizeDestination(value), error: "", message: "" });
  };

  submit = async () => {
    const value = this.normalizeDestination(this.state.value).trim();
    if (!value) {
      this.setState({ error: "กรุณากรอก destination", message: "" });
      return;
    }

    this.setState({ saving: true, error: "", message: "" });
    try {
      if (this.state.editingId) await this.service.update(this.state.editingId, value);
      else await this.service.create(value);
      this.setState({ value: "", editingId: "", saving: false, message: "บันทึก destination เรียบร้อยแล้ว" });
      await this.loadDestinations();
    } catch (error) {
      this.setState({ error: error instanceof Error ? error.message : "Save failed", saving: false });
    }
  };

  startEdit = (destination: DestinationItem) => {
    this.setState({ editingId: destination.id, value: destination.value, error: "", message: "" });
  };

  cancelEdit = () => this.setState({ editingId: "", value: "", error: "", message: "" });

  requestDelete = (deleteTarget: DestinationItem) => this.setState({ deleteTarget, error: "", message: "" });

  closeDeleteModal = () => {
    if (this.state.deleting) return;
    this.setState({ deleteTarget: null });
  };

  confirmDelete = async () => {
    const target = this.state.deleteTarget;
    if (!target) return;

    this.setState({ deleting: true, error: "", message: "" });
    try {
      await this.service.remove(target.id);
      const wasEditing = this.state.editingId === target.id;
      this.setState({
        deleteTarget: null,
        deleting: false,
        editingId: wasEditing ? "" : this.state.editingId,
        value: wasEditing ? "" : this.state.value,
        message: "ลบ destination เรียบร้อยแล้ว",
      });
      await this.loadDestinations();
    } catch (error) {
      this.setState({ error: error instanceof Error ? error.message : "Delete failed", deleting: false });
    }
  };

  dismissMessage = () => this.setState({ message: "" });
  dismissError = () => this.setState({ error: "" });
}

export const destinationsStore = new DestinationsController(destinationApiService, sessionApiService);
