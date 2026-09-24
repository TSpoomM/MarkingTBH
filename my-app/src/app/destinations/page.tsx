"use client";

import { RefreshCw } from "lucide-react";
import StoreContainer from "@/src/components/StoreContainer";
import Button from "@/src/components/ui/Button";
import Toast from "@/src/components/ui/Toast";
import DestinationForm from "@/src/components/destinations/DestinationForm";
import DestinationTable from "@/src/components/destinations/DestinationTable";
import DestinationDeleteModal from "@/src/components/destinations/DestinationDeleteModal";
import { destinationsStore } from "@/src/core/controllers/destinations.controller";
import { CONTAINER, PANEL, TABLE_HEADING } from "@/src/core/ui/surfaces";
import type { DestinationsPageState } from "@/src/core/models/destination";

/** Composition root for the destinations page: the only subscriber to the destinations store. */
export default class DestinationsPage extends StoreContainer<DestinationsPageState> {
  constructor(props: Record<string, never>) {
    super(props, destinationsStore);
  }

  render() {
    const state = this.state;

    if (state.checkingAccess) {
      return <main className={CONTAINER}>กำลังตรวจสอบสิทธิ์...</main>;
    }

    if (!state.isAdmin) {
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
        {state.message && <Toast type="success" message={state.message} onClose={destinationsStore.dismissMessage} />}
        {state.error && <Toast type="error" message={state.error} onClose={destinationsStore.dismissError} />}

        <section className={TABLE_HEADING}>
          <div>
            <h2 className="m-0 text-xl font-black text-[#10231d]">Destinations</h2>
            <p className="m-0 mt-1 text-sm font-semibold text-[#60736b]">จัดการปลายทางที่ใช้ใน autocomplete</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => void destinationsStore.loadDestinations()} disabled={state.loading}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </Button>
        </section>

        <DestinationForm
          value={state.value}
          isEditing={Boolean(state.editingId)}
          saving={state.saving}
          onValueChange={destinationsStore.setValue}
          onSubmit={() => void destinationsStore.submit()}
          onCancelEdit={destinationsStore.cancelEdit}
        />

        <DestinationTable
          destinations={state.destinations}
          loading={state.loading}
          onEdit={destinationsStore.startEdit}
          onDelete={destinationsStore.requestDelete}
        />

        <DestinationDeleteModal
          target={state.deleteTarget}
          deleting={state.deleting}
          onClose={destinationsStore.closeDeleteModal}
          onConfirm={() => void destinationsStore.confirmDelete()}
        />
      </main>
    );
  }
}
