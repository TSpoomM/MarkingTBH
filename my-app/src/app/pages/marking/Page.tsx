"use client";

import StoreContainer from "@/src/components/StoreContainer";
import { markingStore } from "@/src/core/controllers/marking.controller";
import MarkingStickerPlan from "@/src/core/stickers/markingStickerPlan";
import FilterPanel from "@/src/components/marking/FilterPanel";
import OrderTable from "@/src/components/marking/OrderTable";
import Pagination from "@/src/components/marking/Pagination";
import type { MarkingState } from "@/src/core/models/marking";
import type { SelectablePrintOption } from "@/src/core/models/marking-sticker";

/**
 * Composition root for the marking page: the only subscriber to the marking store.
 * Everything the sheet prints or previews is derived by MarkingStickerPlan here,
 * so the panels below stay presentational.
 */
export default class MarkingPage extends StoreContainer<MarkingState> {
  constructor(props: Record<string, never>) {
    super(props, markingStore);
  }

  private toggleOption = (option: SelectablePrintOption, enabled: boolean) => {
    if (option.outsideGroupKey) markingStore.setPrintOutsideGroup(option.outsideGroupKey, enabled);
    else markingStore.setPrintSection(option.section, enabled);
  };

  render() {
    const state = this.state;
    const { framePages, customerNamePages, fscLogoPages } = MarkingStickerPlan.printPages(state);
    const printOptions: SelectablePrintOption[] = MarkingStickerPlan.printOptions(state).map((option) => ({
      ...option,
      selected: MarkingStickerPlan.isOptionSelected(state, option),
    }));

    return (
      <>
        <FilterPanel
          notice={state.notice}
          templates={state.templates}
          templateId={state.templateId}
          template={state.template}
          productionDate={state.productionDate}
          lotCount={state.lotCount}
          lotStart={state.lotStart}
          isLoading={state.isLoading}
          onDismissNotice={markingStore.dismissNotice}
          onSelectTemplate={(templateId) => void markingStore.selectTemplate(templateId)}
          onProductionDateChange={markingStore.setProductionDate}
          onLotCountChange={markingStore.setLotCount}
        />
        <OrderTable
          template={state.template}
          insideRows={state.insideRows}
          outsideRows={state.outsideRows}
          outsideGroups={MarkingStickerPlan.outsideGroups(state)}
          lotStart={state.lotStart}
          isAdmin={state.isAdmin}
          framePages={framePages}
          customerNamePages={customerNamePages}
          fscLogoPages={fscLogoPages}
          onChangeRow={markingStore.updateRow}
        />
        <Pagination
          previewItems={MarkingStickerPlan.previewItems(state)}
          printOptions={printOptions}
          canExport={!!state.template}
          isSaving={state.isSaving}
          isExportModalOpen={state.isExportModalOpen}
          onOpenExportModal={markingStore.openExportModal}
          onCloseExportModal={markingStore.closeExportModal}
          onToggleOption={this.toggleOption}
          onExport={() => void markingStore.saveAndExport()}
        />
      </>
    );
  }
}
