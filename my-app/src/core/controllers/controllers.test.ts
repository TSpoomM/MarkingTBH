import { describe, expect, it, vi } from "vitest";
import Store from "@/src/core/store/store";
import { AdminsController } from "./admins.controller";
import { DestinationsController } from "./destinations.controller";
import type { AdminApiService } from "@/src/core/services/client/admin-api.service";
import type { DestinationApiService } from "@/src/core/services/client/destination-api.service";
import type { SessionApiService } from "@/src/core/services/client/session-api.service";

/** Lets pending promise callbacks run so an async controller action settles. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const stub = <T>(methods: Record<string, unknown>) => methods as unknown as T & typeof methods;

class CountingStore extends Store<{ n: number }> {
  loads = 0;
  refreshes = 0;
  constructor() {
    super({ n: 0 });
  }
  protected async load() {
    this.loads += 1;
  }
  protected async refresh() {
    this.refreshes += 1;
  }
  bump = () => this.setState({ n: this.state.n + 1 });
}

describe("Store", () => {
  it("loads once and refreshes on every later mount", async () => {
    const store = new CountingStore();
    await store.initialize();
    await store.initialize();
    await store.initialize();
    expect([store.loads, store.refreshes]).toEqual([1, 2]);
  });

  it("notifies subscribers with a fresh snapshot and stops after unsubscribe", () => {
    const store = new CountingStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const before = store.getSnapshot();
    store.bump();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).not.toBe(before);
    expect(store.getSnapshot().n).toBe(1);
    unsubscribe();
    store.bump();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("DestinationsController", () => {
  const setup = (isAdmin = true) => {
    const service = stub<DestinationApiService>({
      list: vi.fn(async () => [{ id: "1", value: "OSAKA" }]),
      create: vi.fn(async () => ({ id: "2", value: "TOKYO" })),
      update: vi.fn(async () => ({ id: "1", value: "KYOTO" })),
      remove: vi.fn(async () => undefined),
    });
    const session = stub<SessionApiService>({ isAdmin: vi.fn(async () => isAdmin) });
    return { service, session, store: new DestinationsController(service, session) };
  };

  it("loads the list for an admin", async () => {
    const { store, service } = setup();
    await store.initialize();
    expect(store.getSnapshot()).toMatchObject({ isAdmin: true, checkingAccess: false, loading: false, destinations: [{ id: "1", value: "OSAKA" }] });
    expect(service.list).toHaveBeenCalledTimes(1);
  });

  it("never loads data for a non-admin", async () => {
    const { store, service } = setup(false);
    await store.initialize();
    expect(store.getSnapshot()).toMatchObject({ isAdmin: false, checkingAccess: false, loading: false });
    expect(service.list).not.toHaveBeenCalled();
  });

  it("upper-cases what is typed", async () => {
    const { store } = setup();
    store.setValue("osaka");
    expect(store.getSnapshot().value).toBe("OSAKA");
  });

  it("refuses to save an empty value", async () => {
    const { store, service } = setup();
    store.setValue("   ");
    await store.submit();
    expect(store.getSnapshot().error).toBe("กรุณากรอก destination");
    expect(service.create).not.toHaveBeenCalled();
  });

  it("creates, clears the form, reloads and reports success", async () => {
    const { store, service } = setup();
    store.setValue("tokyo");
    await store.submit();
    expect(service.create).toHaveBeenCalledWith("TOKYO");
    expect(service.list).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toMatchObject({ value: "", saving: false, message: "บันทึก destination เรียบร้อยแล้ว" });
  });

  it("updates instead of creating while editing", async () => {
    const { store, service } = setup();
    store.startEdit({ id: "1", value: "OSAKA" });
    store.setValue("kyoto");
    await store.submit();
    expect(service.update).toHaveBeenCalledWith("1", "KYOTO");
    expect(service.create).not.toHaveBeenCalled();
    expect(store.getSnapshot().editingId).toBe("");
  });

  it("shows the server's error message and stops saving when the request fails", async () => {
    const { store, service } = setup();
    vi.mocked(service.create).mockRejectedValueOnce(new Error("Destination นี้มีอยู่แล้ว"));
    store.setValue("dup");
    await store.submit();
    expect(store.getSnapshot()).toMatchObject({ error: "Destination นี้มีอยู่แล้ว", saving: false });
  });

  it("clears the form when the row being edited is deleted, but not when another row is", async () => {
    const { store, service } = setup();
    store.startEdit({ id: "1", value: "OSAKA" });

    store.requestDelete({ id: "9", value: "OTHER" });
    await store.confirmDelete();
    expect(service.remove).toHaveBeenCalledWith("9");
    expect(store.getSnapshot()).toMatchObject({ editingId: "1", value: "OSAKA", deleteTarget: null });

    store.requestDelete({ id: "1", value: "OSAKA" });
    await store.confirmDelete();
    expect(store.getSnapshot()).toMatchObject({ editingId: "", value: "", message: "ลบ destination เรียบร้อยแล้ว" });
  });

  it("ignores closing the delete dialog while a delete is running", () => {
    const { store } = setup();
    store.requestDelete({ id: "1", value: "OSAKA" });
    store.closeDeleteModal();
    expect(store.getSnapshot().deleteTarget).toBeNull();
  });

  it("starts from a clean form and reloads when the page is opened again", async () => {
    const { store, service } = setup();
    await store.initialize();
    store.setValue("draft");
    await store.initialize();
    expect(store.getSnapshot().value).toBe("");
    expect(service.list).toHaveBeenCalledTimes(2);
  });
});

describe("AdminsController", () => {
  const admin = { idUser: 4, fsId: "10180", name: "Somchai", role: "admin" as const, createdDate: null };
  const setup = (isSuperAdmin = true) => {
    const service = stub<AdminApiService>({
      list: vi.fn(async () => [admin]),
      listEmployees: vi.fn(async () => [{ fsId: "10181", name: "Somsri" }]),
      save: vi.fn(async () => admin),
      remove: vi.fn(async () => undefined),
    });
    const session = stub<SessionApiService>({ isSuperAdmin: vi.fn(async () => isSuperAdmin) });
    return { service, store: new AdminsController(service, session) };
  };

  it("loads admins and employees for a super admin only", async () => {
    const { store, service } = setup();
    await store.initialize();
    expect(store.getSnapshot()).toMatchObject({ isSuperAdmin: true, admins: [admin], employees: [{ fsId: "10181", name: "Somsri" }] });

    const denied = setup(false);
    await denied.store.initialize();
    expect(denied.service.list).not.toHaveBeenCalled();
    expect(denied.service.listEmployees).not.toHaveBeenCalled();
    expect(denied.store.getSnapshot()).toMatchObject({ isSuperAdmin: false, loading: false });
    expect(service.list).toHaveBeenCalledTimes(1);
  });

  it("must have an employee picked from the list before saving", async () => {
    const { store, service } = setup();
    store.setEmployeeQuery("Som"); // typing alone selects nobody
    await store.submit();
    expect(store.getSnapshot().error).toBe("กรุณาเลือกชื่อพนักงานจากรายการ");
    expect(service.save).not.toHaveBeenCalled();
  });

  it("deselects the employee whenever the query text changes", () => {
    const { store } = setup();
    store.selectEmployee({ fsId: "10181", name: "Somsri" });
    expect(store.getSnapshot()).toMatchObject({ selectedFsId: "10181", employeeQuery: "Somsri" });
    store.setEmployeeQuery("Somsr");
    expect(store.getSnapshot().selectedFsId).toBe("");
  });

  it("saves the chosen employee with the chosen role, then resets the form", async () => {
    const { store, service } = setup();
    store.selectEmployee({ fsId: "10181", name: "Somsri" });
    store.setRole("super_admin");
    await store.submit();
    expect(service.save).toHaveBeenCalledWith("10181", "super_admin");
    expect(store.getSnapshot()).toMatchObject({ employeeQuery: "", selectedFsId: "", role: "admin", editingAdminId: null, message: "บันทึก admin เรียบร้อยแล้ว" });
  });

  it("loads a row into the form for editing and clears it on cancel", () => {
    const { store } = setup();
    store.startEdit({ ...admin, role: "super_admin" });
    expect(store.getSnapshot()).toMatchObject({ editingAdminId: 4, employeeQuery: "Somchai", selectedFsId: "10180", role: "super_admin" });
    store.cancelEdit();
    expect(store.getSnapshot()).toMatchObject({ editingAdminId: null, employeeQuery: "", role: "admin" });
  });

  it("resets the form only when the deleted admin is the one being edited", async () => {
    const { store, service } = setup();
    store.startEdit(admin);

    store.requestDelete({ ...admin, idUser: 8 });
    await store.confirmDelete();
    expect(service.remove).toHaveBeenCalledWith(8);
    expect(store.getSnapshot().editingAdminId).toBe(4);

    store.requestDelete(admin);
    await store.confirmDelete();
    expect(store.getSnapshot()).toMatchObject({ editingAdminId: null, employeeQuery: "", message: "ลบ admin เรียบร้อยแล้ว" });
  });

  it("keeps the dialog state consistent when delete fails", async () => {
    const { store, service } = setup();
    vi.mocked(service.remove).mockRejectedValueOnce(new Error("boom"));
    store.requestDelete(admin);
    await store.confirmDelete();
    await settle();
    expect(store.getSnapshot()).toMatchObject({ error: "boom", deleting: false });
  });
});
