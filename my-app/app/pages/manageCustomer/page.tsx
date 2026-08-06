"use client";

import Link from "next/link";
import { Component, type FormEvent } from "react";
import Navbar from "@/app/components/Navbar";
import Toast from "@/app/components/Toast";
import type { Customer, CustomerTemplate, TemplateField } from "@/app/types/customer";
import {
  type CreateCustomerPayload,
  type InsideGroup,
  type OutsideTable,
  type StickerField,
  type StickerLayoutKey,
} from "@/app/types/customer-form";
import {
  createSegments,
  fixedInsideFields,
  initialGroups,
  type CustomerFormState,
  type CustomerManageMode,
} from "@/app/types/manage-customer";
import CreateCustomerForm from "./CreateCustomerForm";
import EditCustomerTemplate from "./EditCustomerTemplate";
import {
  cleanCondition,
  inferCounterType,
  normalizeCounterField,
  uniqueSegmentKey,
  uid,
} from "./CustomerManageShared";

const createDefaultInsideDraft = (): TemplateField[] => [
  ...initialGroups.map((group, groupIndex) => normalizeCounterField({
    key: group.key,
    label: group.label,
    type: "text" as const,
    required: true,
    showOnSticker: true,
    stickerOrder: groupIndex,
    segments: group.segments.map((segment, segmentIndex) => ({
      ...segment,
      showOnSticker: true,
      stickerOrder: groupIndex * 10 + segmentIndex,
    })),
  })),
  ...fixedInsideFields.map((field, index) => ({
    ...field,
    type: "text" as const,
    showOnSticker: true,
    stickerOrder: initialGroups.length + index,
  })),
];

const normalizeInsideField = (field: TemplateField): TemplateField =>
  normalizeCounterField({
    ...field,
    required: true,
    condition: undefined,
    showOnSticker: field.showOnSticker ?? true,
  });

export default class CustomerForm extends Component<Record<string, never>, CustomerFormState> {
  state: CustomerFormState = {
    mode: "edit",
    customers: [],
    selectedCustomerId: "",
    templateInsideDraft: [],
    templateOutsideDraft: [],
    createInsideDraft: createDefaultInsideDraft(),
    createOutsideDraft: [],
    name: "",
    stickerFields: ["side", "format"],
    stickerLayouts: {
      insideFrame: true,
      outsideFrame: true,
      customerName: false,
    },
    templateStickerLayouts: {
      insideFrame: true,
      outsideFrame: true,
      customerName: false,
    },
    groups: initialGroups.map((group) => ({
      ...group,
      segments: group.segments.map((segment) => ({ ...segment })),
    })),
    tables: [],
    notice: undefined,
    templateNotice: undefined,
    isAdmin: false,
    checkingRole: true,
    loadingCustomers: false,
    loadingTemplate: false,
    savingTemplate: false,
    saving: false,
  };

  async componentDidMount() {
    try {
      const response = await fetch("/api/session");
      const session = (await response.json()) as { user?: { role?: string } };
      this.setState({
        isAdmin: response.ok && session.user?.role === "admin",
        checkingRole: false,
      });
      if (response.ok && session.user?.role === "admin") {
        await this.loadCustomers();
      }
    } catch {
      this.setState({ isAdmin: false, checkingRole: false });
    }
  }

  private changeMode = (mode: CustomerManageMode) => {
    this.setState({
      mode,
      notice: undefined,
      templateNotice: undefined,
    });
  };

  private loadCustomers = async () => {
    this.setState({ loadingCustomers: true });
    try {
      const response = await fetch("/api/customers");
      const result = (await response.json()) as { data?: Customer[]; message?: string };
      if (!response.ok) throw new Error(result.message);
      this.setState({ customers: result.data ?? [] });
    } catch (error) {
      this.setState({
        templateNotice: {
          kind: "error",
          text: error instanceof Error ? error.message : "โหลดรายชื่อลูกค้าไม่สำเร็จ",
        },
      });
    } finally {
      this.setState({ loadingCustomers: false });
    }
  };

  private selectTemplateCustomer = async (customerId: string) => {
    this.setState({
      selectedCustomerId: customerId,
      templateInsideDraft: [],
      templateOutsideDraft: [],
      templateStickerLayouts: {
        insideFrame: true,
        outsideFrame: true,
        customerName: false,
      },
      templateNotice: undefined,
    });
    if (!customerId) return;
    this.setState({ loadingTemplate: true });
    try {
      const response = await fetch(`/api/customers/${customerId}/template`);
      const result = (await response.json()) as { data?: CustomerTemplate; message?: string };
      if (!response.ok || !result.data) throw new Error(result.message);
      this.setState({
        templateInsideDraft: result.data.inside.map((field) => normalizeInsideField(field)),
        templateOutsideDraft: result.data.outside.map((field) => ({ ...field, showOnSticker: field.showOnSticker ?? true })),
        templateStickerLayouts: result.data.sticker.layouts,
      });
    } catch (error) {
      this.setState({
        templateNotice: {
          kind: "error",
          text: error instanceof Error ? error.message : "โหลด Template ไม่สำเร็จ",
        },
      });
    } finally {
      this.setState({ loadingTemplate: false });
    }
  };

  private changeTemplateDraft = (
    section: "inside" | "outside",
    index: number,
    patch: Partial<TemplateField>,
  ) => {
    const key = section === "inside" ? "templateInsideDraft" : "templateOutsideDraft";
    this.setState({
      [key]: this.state[key].map((field, fieldIndex) =>
        fieldIndex === index
          ? section === "inside"
            ? normalizeInsideField({ ...field, ...patch })
            : normalizeCounterField({ ...field, ...patch })
          : field,
      ),
    } as Pick<CustomerFormState, typeof key>);
  };

  private changeCreateTemplateDraft = (
    section: "inside" | "outside",
    index: number,
    patch: Partial<TemplateField>,
  ) => {
    const key = section === "inside" ? "createInsideDraft" : "createOutsideDraft";
    this.setState({
      [key]: this.state[key].map((field, fieldIndex) =>
        fieldIndex === index
          ? section === "inside"
            ? normalizeInsideField({ ...field, ...patch })
            : normalizeCounterField({ ...field, ...patch })
          : field,
      ),
    } as Pick<CustomerFormState, typeof key>);
  };

  private addTemplateField = (section: "inside" | "outside", tableOrder?: number) => {
    const key = section === "inside" ? "templateInsideDraft" : "templateOutsideDraft";
    const outsideGroup = section === "outside"
      ? this.outsideGroup(this.state[key] as TemplateField[], tableOrder)
      : undefined;
    const nextField: TemplateField = {
      key: `${section}_field_${uid()}`,
      label: "",
      type: "text",
      required: section === "inside",
      showOnSticker: true,
      stickerGroup: outsideGroup?.name,
      stickerGroupOrder: outsideGroup?.order,
      uppercase: section === "outside" ? true : undefined,
    };
    const currentFields = this.state[key];
    const insertIndex = section === "outside"
      ? this.lastOutsideGroupIndex(currentFields as TemplateField[], outsideGroup?.order ?? 0) + 1
      : currentFields.length;
    this.setState({
      [key]: [
        ...currentFields.slice(0, insertIndex),
        nextField,
        ...currentFields.slice(insertIndex),
      ],
    } as Pick<CustomerFormState, typeof key>);
  };

  private addCreateTemplateField = (section: "inside" | "outside", tableOrder?: number) => {
    const key = section === "inside" ? "createInsideDraft" : "createOutsideDraft";
    const outsideGroup = section === "outside"
      ? this.outsideGroup(this.state[key] as TemplateField[], tableOrder)
      : undefined;
    const nextField: TemplateField = {
      key: `${section}_field_${uid()}`,
      label: "",
      type: "text",
      required: section === "inside",
      showOnSticker: true,
      stickerGroup: outsideGroup?.name,
      stickerGroupOrder: outsideGroup?.order,
      uppercase: section === "outside" ? true : undefined,
    };
    const currentFields = this.state[key];
    const insertIndex = section === "outside"
      ? this.lastOutsideGroupIndex(currentFields as TemplateField[], outsideGroup?.order ?? 0) + 1
      : currentFields.length;
    this.setState({
      [key]: [
        ...currentFields.slice(0, insertIndex),
        nextField,
        ...currentFields.slice(insertIndex),
      ],
    } as Pick<CustomerFormState, typeof key>);
  };

  private lastOutsideGroupIndex(fields: TemplateField[], tableOrder: number) {
    return fields.reduce((lastIndex, field, index) =>
      (field.stickerGroupOrder ?? 0) === tableOrder ? index : lastIndex,
    -1);
  }

  private outsideGroup(fields: TemplateField[], requestedOrder?: number) {
    if (!fields.length) return { order: 0, name: "Outside 1" };
    const order = requestedOrder ?? Math.max(...fields.map((field) => field.stickerGroupOrder ?? 0));
    const field = [...fields].reverse().find((item) => (item.stickerGroupOrder ?? 0) === order);
    return { order, name: field?.stickerGroup ?? `Outside ${order + 1}` };
  }

  private nextOutsideGroupOrder(fields: TemplateField[]) {
    return fields.length ? Math.max(...fields.map((field) => field.stickerGroupOrder ?? 0)) + 1 : 0;
  }

  private addTemplateTable = () => {
    const tableOrder = this.nextOutsideGroupOrder(this.state.templateOutsideDraft);
    this.setState({
      templateOutsideDraft: [
        ...this.state.templateOutsideDraft,
        {
          key: `outside_field_${uid()}`,
          label: "",
          type: "text",
          required: false,
          showOnSticker: true,
          stickerGroup: `Outside ${tableOrder + 1}`,
          stickerGroupOrder: tableOrder,
          uppercase: true,
        },
      ],
    });
  };

  private addCreateTemplateTable = () => {
    const tableOrder = this.nextOutsideGroupOrder(this.state.createOutsideDraft);
    this.setState({
      createOutsideDraft: [
        ...this.state.createOutsideDraft,
        {
          key: `outside_field_${uid()}`,
          label: "",
          type: "text",
          required: false,
          showOnSticker: true,
          stickerGroup: `Outside ${tableOrder + 1}`,
          stickerGroupOrder: tableOrder,
          uppercase: true,
        },
      ],
    });
  };

  private renameTemplateTable = (tableOrder: number, name: string) => {
    this.setState({
      templateOutsideDraft: this.state.templateOutsideDraft.map((field) =>
        (field.stickerGroupOrder ?? 0) === tableOrder ? { ...field, stickerGroup: name } : field,
      ),
    });
  };

  private renameCreateTemplateTable = (tableOrder: number, name: string) => {
    this.setState({
      createOutsideDraft: this.state.createOutsideDraft.map((field) =>
        (field.stickerGroupOrder ?? 0) === tableOrder ? { ...field, stickerGroup: name } : field,
      ),
    });
  };

  private removeTemplateTable = (tableOrder: number) => {
    this.setState({
      templateOutsideDraft: this.state.templateOutsideDraft.filter((field) => (field.stickerGroupOrder ?? 0) !== tableOrder),
    });
  };

  private removeCreateTemplateTable = (tableOrder: number) => {
    this.setState({
      createOutsideDraft: this.state.createOutsideDraft.filter((field) => (field.stickerGroupOrder ?? 0) !== tableOrder),
    });
  };

  private removeTemplateField = (section: "inside" | "outside", index: number) => {
    const key = section === "inside" ? "templateInsideDraft" : "templateOutsideDraft";
    this.setState({
      [key]: this.state[key].filter((_, fieldIndex) => fieldIndex !== index),
    } as Pick<CustomerFormState, typeof key>);
  };

  private removeCreateTemplateField = (section: "inside" | "outside", index: number) => {
    const key = section === "inside" ? "createInsideDraft" : "createOutsideDraft";
    this.setState({
      [key]: this.state[key].filter((_, fieldIndex) => fieldIndex !== index),
    } as Pick<CustomerFormState, typeof key>);
  };

  private setPreviewSlot = (section: "inside" | "outside", slotIndex: number, fieldKey: string) => {
    const key = section === "inside" ? "templateInsideDraft" : "templateOutsideDraft";
    this.setPreviewSlotForDraft(key, slotIndex, fieldKey);
  };

  private setCreatePreviewSlot = (section: "inside" | "outside", slotIndex: number, fieldKey: string) => {
    const key = section === "inside" ? "createInsideDraft" : "createOutsideDraft";
    this.setPreviewSlotForDraft(key, slotIndex, fieldKey);
  };

  private setPreviewSlotForDraft = (
    key: "templateInsideDraft" | "templateOutsideDraft" | "createInsideDraft" | "createOutsideDraft",
    slotIndex: number,
    fieldKey: string,
  ) => {
    const [targetFieldKey, targetSegmentKey] = fieldKey.split(".");
    this.setState({
      [key]: this.state[key].map((field) => {
        if (field.segments?.length) {
          return {
            ...field,
            segments: field.segments.map((segment) => {
              const isTarget = field.key === targetFieldKey && segment.key === targetSegmentKey;
              const isSameSlot = segment.stickerOrder === slotIndex;
              if (isTarget) return { ...segment, showOnSticker: true, stickerOrder: slotIndex };
              if (isSameSlot) return { ...segment, showOnSticker: false, stickerOrder: undefined };
              return segment;
            }),
          };
        }
        if (field.key === targetFieldKey) {
          return fieldKey ? { ...field, showOnSticker: true, stickerOrder: slotIndex } : field;
        }
        if (field.stickerOrder === slotIndex) {
          return { ...field, showOnSticker: false, stickerOrder: undefined };
        }
        return field;
      }),
    } as Pick<CustomerFormState, typeof key>);
  };

  private cleanTemplateFields = (section: "inside" | "outside", fields: TemplateField[]) => fields.map((field, index) => {
    const fieldKey = field.key.trim() || `${section}_field_${uid()}`;
    const usedSegmentKeys = new Set<string>();
    return normalizeCounterField({
      ...field,
      key: fieldKey,
      label: field.label.trim(),
      required: section === "inside" ? true : field.required,
      condition: section === "inside" ? undefined : cleanCondition(field.condition),
      showOnSticker: field.showOnSticker ?? true,
      stickerOrder: field.showOnSticker === false ? undefined : field.stickerOrder ?? index,
      uppercase: section === "outside" ? field.uppercase ?? true : field.uppercase,
      segments: field.segments?.map((segment, segmentIndex) => ({
        ...segment,
        key: uniqueSegmentKey(fieldKey, segment.key, segmentIndex, usedSegmentKeys),
        label: segment.label.trim(),
        showOnSticker: segment.showOnSticker ?? true,
        stickerOrder: segment.showOnSticker === false ? undefined : segment.stickerOrder ?? index * 10 + segmentIndex,
        counterType: segment.counterType ?? inferCounterType({ ...field, key: fieldKey }),
      })),
    });
  });

  private validateTemplateDrafts = (
    inside: TemplateField[],
    outside: TemplateField[],
    layouts: CustomerFormState["stickerLayouts"],
  ): string | undefined => {
    if ([...inside, ...outside].some((field) => !field.label || field.segments?.some((segment) => !segment.label))) {
      return "Please fill every field name";
    }
    if (!layouts.insideFrame && !layouts.outsideFrame && !layouts.customerName) {
      return "Please choose at least one sticker layout";
    }
    if (
      new Set(inside.map((field) => field.key)).size !== inside.length ||
      new Set(outside.map((field) => field.key)).size !== outside.length
    ) {
      return "Some field keys are duplicated. Remove and add the field again";
    }
    return undefined;
  };

  private saveExistingTemplate = async () => {
    if (!this.state.selectedCustomerId) return;
    const inside = this.cleanTemplateFields("inside", this.state.templateInsideDraft);
    const outside = this.cleanTemplateFields("outside", this.state.templateOutsideDraft);
    if ([...inside, ...outside].some((field) => !field.label)) {
      this.setState({ templateNotice: { kind: "error", text: "กรุณากรอกชื่อ Field ให้ครบ" } });
      return;
    }
    if (
      !this.state.templateStickerLayouts.insideFrame &&
      !this.state.templateStickerLayouts.outsideFrame &&
      !this.state.templateStickerLayouts.customerName
    ) {
      this.setState({ templateNotice: { kind: "error", text: "เลือกรูปแบบสติ๊กเกอร์ที่ต้องพิมพ์อย่างน้อย 1 แบบ" } });
      return;
    }
    if (
      new Set(inside.map((field) => field.key)).size !== inside.length ||
      new Set(outside.map((field) => field.key)).size !== outside.length
    ) {
      this.setState({ templateNotice: { kind: "error", text: "ชื่อ Field บางรายการซ้ำกันในระบบ กรุณาลบแล้วเพิ่ม Field ใหม่อีกครั้ง" } });
      return;
    }

    this.setState({ savingTemplate: true, templateNotice: undefined });
    try {
      const response = await fetch(`/api/customers/${this.state.selectedCustomerId}/template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-role": "admin" },
        body: JSON.stringify({
          inside,
          outside,
          sticker: { layouts: this.state.templateStickerLayouts },
          updatedBy: "ADMIN",
        }),
      });
      const result = (await response.json()) as { data?: CustomerTemplate; message?: string };
      if (!response.ok || !result.data) throw new Error(result.message);
      this.setState({
        templateInsideDraft: result.data.inside.map((field) => normalizeInsideField(field)),
        templateOutsideDraft: result.data.outside.map((field) => ({ ...field, showOnSticker: field.showOnSticker ?? true })),
        templateNotice: { kind: "success", text: "บันทึก Sticker Template แล้ว" },
      });
    } catch (error) {
      this.setState({
        templateNotice: {
          kind: "error",
          text: error instanceof Error ? error.message : "บันทึก Template ไม่สำเร็จ",
        },
      });
    } finally {
      this.setState({ savingTemplate: false });
    }
  };

  private changeStickerFields = (nextFields: StickerField[]) => {
    this.setState({ stickerFields: nextFields });
  };

  private dismissNotice = () => {
    this.setState({ notice: undefined });
  };

  private dismissTemplateNotice = () => {
    this.setState({ templateNotice: undefined });
  };

  private toggleStickerLayout = (layout: StickerLayoutKey) => {
    this.setState((current) => ({
      stickerLayouts: {
        ...current.stickerLayouts,
        [layout]: !current.stickerLayouts[layout],
      },
    }));
  };

  private toggleTemplateStickerLayout = (layout: StickerLayoutKey) => {
    this.setState((current) => ({
      templateStickerLayouts: {
        ...current.templateStickerLayouts,
        [layout]: !current.templateStickerLayouts[layout],
      },
    }));
  };

  private changeSegmentCount = (groupKey: InsideGroup["key"], count: number) => {
    this.setState((current) => ({
      groups: current.groups.map((group) => {
        if (group.key !== groupKey) return group;
        const segments = createSegments(groupKey, count)
          .map((segment, index) => group.segments[index] ?? segment);
        const hasCounter = segments.some((segment) => segment.isCounter);
        return {
          ...group,
          segments: segments.map((segment, index) => ({
            ...segment,
            isCounter: hasCounter ? segment.isCounter : index === 0,
          })),
        };
      }),
    }));
  };

  private updateTable = (tableId: string, update: (table: OutsideTable) => OutsideTable) => {
    this.setState((current) => ({
      tables: current.tables.map((table) => (table.id === tableId ? update(table) : table)),
    }));
  };

  private updateTables = (updater: (tables: OutsideTable[]) => OutsideTable[]) => {
    this.setState((current) => ({ tables: updater(current.tables) }));
  };

  private updateGroupSegment = (groupKey: InsideGroup["key"], segmentIndex: number, label: string) => {
    this.setState((current) => ({
      groups: current.groups.map((group) => {
        if (group.key !== groupKey) return group;
        return {
          ...group,
          segments: group.segments.map((segment, index) =>
            index === segmentIndex ? { ...segment, label } : segment,
          ),
        };
      }),
    }));
  };

  private submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.setState({ notice: undefined });
    const inside = this.cleanTemplateFields("inside", this.state.createInsideDraft);
    const outside = this.cleanTemplateFields("outside", this.state.createOutsideDraft);
    const validationError = this.validateTemplateDrafts(inside, outside, this.state.stickerLayouts);
    if (validationError) {
      this.setState({ notice: { kind: "error", text: validationError } });
      return;
    }

    const payload: CreateCustomerPayload = {
      name: this.state.name,
      configuration: {
        version: 2,
        sticker: {
          enabledFields: this.state.stickerFields,
          layouts: this.state.stickerLayouts,
        },
        inside: { groups: this.state.groups, fields: [...fixedInsideFields] },
        outside: { tables: this.state.tables },
      },
      template: {
        sticker: {
          enabledFields: this.state.stickerFields,
          layouts: this.state.stickerLayouts,
        },
        inside,
        outside,
      },
    };

    this.setState({ saving: true });
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "admin" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      this.setState({
        name: "",
        createInsideDraft: createDefaultInsideDraft(),
        createOutsideDraft: [],
        notice: {
          kind: "success",
          text: `เพิ่ม ${result.data.name} เรียบร้อยแล้ว (Customer ID: ${result.data.id})`,
        },
      });
      await this.loadCustomers();
    } catch (error) {
      this.setState({
        notice: {
          kind: "error",
          text: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ",
        },
      });
    } finally {
      this.setState({ saving: false });
    }
  };

  render() {
    const selectedCustomer = this.state.customers.find((customer) =>
      String(customer.id) === this.state.selectedCustomerId,
    );

    return (
      <div className="customer-admin">
        <Navbar
          badge="ADM"
          title="จัดการ Customer"
          subtitle="เพิ่มลูกค้าใหม่ และแก้ไข Sticker Template ของลูกค้าเดิม"
          action={<Link className="back-link" href="/">กลับหน้าหลัก</Link>}
        />
        <main className="customer-form-wrap">
          {this.state.checkingRole && <Toast type="success" message="กำลังตรวจสอบสิทธิ์..." />}
          {!this.state.checkingRole && !this.state.isAdmin && (
            <Toast type="error" message="เฉพาะ Admin เท่านั้นที่จัดการ Customer และ Sticker Template ได้" />
          )}
          {!this.state.checkingRole && this.state.isAdmin && (
            <>
              <div className="customer-admin-top">
                <div className="customer-mode-switch" aria-label="เลือกโหมดจัดการ Customer">
                  <button
                    type="button"
                    className={this.state.mode === "edit" ? "active" : ""}
                    onClick={() => this.changeMode("edit")}
                  >
                    แก้ไข Template
                  </button>
                  <button
                    type="button"
                    className={this.state.mode === "create" ? "active" : ""}
                    onClick={() => this.changeMode("create")}
                  >
                    เพิ่ม Customer
                  </button>
                </div>
                <div className="customer-mode-help">
                  <strong>{this.state.mode === "edit" ? "เลือก Customer เดิม แล้วปรับช่องบนสติ๊กเกอร์" : "สร้าง Customer ใหม่ แล้วกำหนดช่องที่ User ต้องกรอก"}</strong>
                  <span>{this.state.mode === "edit" ? "เหมาะกับการแก้ Field, ลำดับ Preview และ Template ที่ใช้อยู่" : "ทำตามลำดับ 1 ถึง 4 แล้วกดบันทึกด้านล่าง"}</span>
                </div>
              </div>
              {this.state.mode === "edit" && (
                <EditCustomerTemplate
                  customers={this.state.customers}
                  selectedCustomer={selectedCustomer}
                  selectedCustomerId={this.state.selectedCustomerId}
                  insideDraft={this.state.templateInsideDraft}
                  outsideDraft={this.state.templateOutsideDraft}
                  stickerLayouts={this.state.templateStickerLayouts}
                  notice={this.state.templateNotice}
                  loadingCustomers={this.state.loadingCustomers}
                  loadingTemplate={this.state.loadingTemplate}
                  savingTemplate={this.state.savingTemplate}
                  onDismissNotice={this.dismissTemplateNotice}
                  onSelectCustomer={(customerId) => void this.selectTemplateCustomer(customerId)}
                  onSave={() => void this.saveExistingTemplate()}
                  onToggleLayout={this.toggleTemplateStickerLayout}
                  onSelectPreviewSlot={this.setPreviewSlot}
                  onChangeField={this.changeTemplateDraft}
                  onAddField={this.addTemplateField}
                  onRemoveField={this.removeTemplateField}
                  onAddTable={this.addTemplateTable}
                  onRenameTable={this.renameTemplateTable}
                  onRemoveTable={this.removeTemplateTable}
                />
              )}
              {this.state.mode === "create" && (
                <CreateCustomerForm
                  name={this.state.name}
                  stickerFields={this.state.stickerFields}
                  stickerLayouts={this.state.stickerLayouts}
                  groups={this.state.groups}
                  tables={this.state.tables}
                  fixedInsideFields={fixedInsideFields}
                  insideDraft={this.state.createInsideDraft}
                  outsideDraft={this.state.createOutsideDraft}
                  notice={this.state.notice}
                  saving={this.state.saving}
                  onDismissNotice={this.dismissNotice}
                  onSubmit={this.submit}
                  onNameChange={(name) => this.setState({ name })}
                  onStickerFieldsChange={this.changeStickerFields}
                  onToggleLayout={this.toggleStickerLayout}
                  onSegmentCountChange={this.changeSegmentCount}
                  onGroupSegmentChange={this.updateGroupSegment}
                  onTablesChange={this.updateTables}
                  onTableUpdate={this.updateTable}
                  onSelectPreviewSlot={this.setCreatePreviewSlot}
                  onChangeField={this.changeCreateTemplateDraft}
                  onAddField={this.addCreateTemplateField}
                  onRemoveField={this.removeCreateTemplateField}
                  onAddTable={this.addCreateTemplateTable}
                  onRenameTable={this.renameCreateTemplateTable}
                  onRemoveTable={this.removeCreateTemplateTable}
                />
              )}
            </>
          )}
        </main>
      </div>
    );
  }
}
