"use client";

import { RefreshCw } from "lucide-react";
import StoreContainer from "@/src/components/StoreContainer";
import Button from "@/src/components/ui/Button";
import Toast from "@/src/components/ui/Toast";
import AdminForm from "@/src/components/admins/AdminForm";
import AdminTable from "@/src/components/admins/AdminTable";
import AdminDeleteModal from "@/src/components/admins/AdminDeleteModal";
import { adminsStore } from "@/src/core/controllers/admins.controller";
import { CONTAINER, PANEL, TABLE_HEADING } from "@/src/core/ui/surfaces";
import type { AdminPageState } from "@/src/core/models/admin";

/** Composition root for the admins page: the only subscriber to the admins store. */
export default class AdminsPage extends StoreContainer<AdminPageState> {
  constructor(props: Record<string, never>) {
    super(props, adminsStore);
  }

  render() {
    const state = this.state;

    if (state.checkingAccess) {
      return <main className={CONTAINER}>กำลังตรวจสอบสิทธิ์...</main>;
    }

    if (!state.isSuperAdmin) {
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
        {state.message && <Toast type="success" message={state.message} onClose={adminsStore.dismissMessage} />}
        {state.error && <Toast type="error" message={state.error} onClose={adminsStore.dismissError} />}

        <section className={TABLE_HEADING}>
          <div>
            <h2 className="m-0 text-xl font-black text-[#10231d]">Admins</h2>
            <p className="m-0 mt-1 text-sm font-semibold text-[#60736b]">จัดการสิทธิ์ admin</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => void adminsStore.loadAdmins()} disabled={state.loading}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </Button>
        </section>

        <AdminForm
          employees={state.employees}
          employeeQuery={state.employeeQuery}
          role={state.role}
          isEditing={state.editingAdminId !== null}
          saving={state.saving}
          onEmployeeQueryChange={adminsStore.setEmployeeQuery}
          onEmployeeSelect={adminsStore.selectEmployee}
          onRoleChange={adminsStore.setRole}
          onSubmit={() => void adminsStore.submit()}
          onCancelEdit={adminsStore.cancelEdit}
        />

        <AdminTable
          admins={state.admins}
          loading={state.loading}
          onEdit={adminsStore.startEdit}
          onDelete={adminsStore.requestDelete}
        />

        <AdminDeleteModal
          target={state.deleteTarget}
          deleting={state.deleting}
          onClose={adminsStore.closeDeleteModal}
          onConfirm={() => void adminsStore.confirmDelete()}
        />
      </main>
    );
  }
}
