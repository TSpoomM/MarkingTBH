"use client";

import Link from "next/link";
import { Component, type FormEvent, type ReactNode } from "react";
import Navbar from "@/app/components/Navbar";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import Select from "@/app/components/Select";
import type { Customer, CustomerTemplate, TemplateField } from "@/app/types/customer";
import {
  type CreateCustomerPayload,
  type InsideGroup,
  type OutsideField,
  type OutsideTable,
  type StickerField,
  type StickerLayoutKey,
  type StickerLayouts,
} from "@/app/types/customer-form";

const createSegments = (group: InsideGroup["key"], count: number) =>
  Array.from({ length: count }, (_, index) => ({
    key: `${group}_${index + 1}`,
    isCounter: index === 0,
    type: index === 0 ? "number" as const : "text" as const,
    label: `ส่วนที่ ${index + 1}`,
  }));

const initialGroups: InsideGroup[] = [
  { key: "lotNo", label: "LOT NO.", segments: createSegments("lotNo", 1) },
  { key: "palletNo", label: "PALLET NO.", segments: createSegments("palletNo", 1) },
];

const fixedInsideFields = [
  { key: "gross", label: "GROSS", required: true },
  { key: "nett", label: "NETT", required: true },
  { key: "destination", label: "DESTINATION", required: true },
  { key: "contractNo", label: "CONTRACT NO.", required: true },
] as const;

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

type CustomerFormNotice = { kind: "error" | "success"; text: string };
type CustomerManageMode = "edit" | "create";
type StickerSelectableField = {
  key: string;
  label: string;
  parentLabel: string;
  segmentLabel?: string;
  showOnSticker: boolean;
  stickerOrder: number | undefined;
};

const isCounterField = (field: Pick<TemplateField, "key" | "label">) => {
  const key = field.key.toLowerCase();
  const label = field.label.toLowerCase();
  return key.includes("lot") || key.includes("pallet") || label.includes("lot") || label.includes("pallet");
};

const normalizeCounterField = (field: TemplateField): TemplateField => {
  if (!field.segments?.length || !isCounterField(field)) return field;
  const counterIndex = field.segments.findIndex((segment) => segment.isCounter);
  return {
    ...field,
    segments: field.segments.map((segment, index) => ({
      ...segment,
      isCounter: counterIndex >= 0 ? index === counterIndex : index === 0,
      type: (counterIndex >= 0 ? index === counterIndex : index === 0) ? "number" : segment.type ?? "text",
      showOnSticker: (counterIndex >= 0 ? index === counterIndex : index === 0)
        ? true
        : segment.showOnSticker,
    })),
  };
};

const stickerSelectableFields = (fields: TemplateField[]): StickerSelectableField[] =>
  fields.flatMap((field) =>
    field.segments?.length
      ? field.segments.map((segment) => ({
        key: `${field.key}.${segment.key}`,
        label: `${field.label} - ${segment.label}${segment.isCounter ? " (+1)" : ""}`,
        parentLabel: field.label,
        segmentLabel: segment.label,
        showOnSticker: segment.showOnSticker !== false,
        stickerOrder: segment.stickerOrder,
      }))
      : [{
        key: field.key,
        label: field.label,
        parentLabel: field.label,
        showOnSticker: field.showOnSticker !== false,
        stickerOrder: field.stickerOrder,
      }],
  );

const selectedStickerFields = (fields: TemplateField[]) =>
  stickerSelectableFields(fields)
    .filter((field) => field.showOnSticker)
    .sort((a, b) => (a.stickerOrder ?? 0) - (b.stickerOrder ?? 0));

const groupSelectedStickerFields = (fields: StickerSelectableField[]) =>
  fields.reduce<Array<{ label: string; fields: StickerSelectableField[] }>>((groups, field) => {
    const group = groups.find((item) => item.label === field.parentLabel);
    if (group) {
      group.fields.push(field);
      return groups;
    }
    return [...groups, { label: field.parentLabel, fields: [field] }];
  }, []);

interface CustomerFormState {
  mode: CustomerManageMode;
  customers: Customer[];
  selectedCustomerId: string;
  templateInsideDraft: TemplateField[];
  templateOutsideDraft: TemplateField[];
  name: string;
  stickerFields: StickerField[];
  stickerLayouts: StickerLayouts;
  groups: InsideGroup[];
  tables: OutsideTable[];
  notice: CustomerFormNotice | undefined;
  templateNotice: CustomerFormNotice | undefined;
  isAdmin: boolean;
  checkingRole: boolean;
  loadingCustomers: boolean;
  loadingTemplate: boolean;
  savingTemplate: boolean;
  saving: boolean;
}

export default class CustomerForm extends Component<Record<string, never>, CustomerFormState> {
  state: CustomerFormState = {
    mode: "edit",
    customers: [],
    selectedCustomerId: "",
    templateInsideDraft: [],
    templateOutsideDraft: [],
    name: "",
    stickerFields: ["side", "format"],
    stickerLayouts: {
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

  private changeMode = (mode: CustomerManageMode) => {
    this.setState({
      mode,
      notice: undefined,
      templateNotice: undefined,
    });
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
      templateNotice: undefined,
    });
    if (!customerId) return;
    this.setState({ loadingTemplate: true });
    try {
      const response = await fetch(`/api/customers/${customerId}/template`);
      const result = (await response.json()) as { data?: CustomerTemplate; message?: string };
      if (!response.ok || !result.data) throw new Error(result.message);
      this.setState({
        templateInsideDraft: result.data.inside.map((field) => normalizeCounterField({ ...field, showOnSticker: field.showOnSticker ?? true })),
        templateOutsideDraft: result.data.outside.map((field) => ({ ...field, showOnSticker: field.showOnSticker ?? true })),
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
        fieldIndex === index ? { ...field, ...patch } : field,
      ),
    } as Pick<CustomerFormState, typeof key>);
  };

  private addTemplateField = (section: "inside" | "outside") => {
    const key = section === "inside" ? "templateInsideDraft" : "templateOutsideDraft";
    this.setState({
      [key]: [
        ...this.state[key],
        {
          key: `${section}_field_${this.state[key].length + 1}`,
          label: "",
          type: "text",
          required: false,
          showOnSticker: false,
        },
      ],
    } as Pick<CustomerFormState, typeof key>);
  };

  private removeTemplateField = (section: "inside" | "outside", index: number) => {
    const key = section === "inside" ? "templateInsideDraft" : "templateOutsideDraft";
    this.setState({
      [key]: this.state[key].filter((_, fieldIndex) => fieldIndex !== index),
    } as Pick<CustomerFormState, typeof key>);
  };

  private setPreviewSlot = (section: "inside" | "outside", slotIndex: number, fieldKey: string) => {
    const key = section === "inside" ? "templateInsideDraft" : "templateOutsideDraft";
    const [targetFieldKey, targetSegmentKey] = fieldKey.split(".");
    this.setState({
      [key]: this.state[key].map((field) => {
        if (field.segments?.length) {
          return {
            ...field,
            segments: field.segments.map((segment) => {
              const isTarget = field.key === targetFieldKey && segment.key === targetSegmentKey;
              const isSameSlot = segment.stickerOrder === slotIndex;
              if (isTarget) {
                return { ...segment, showOnSticker: true, stickerOrder: slotIndex };
              }
              if (isSameSlot) {
                return { ...segment, showOnSticker: false, stickerOrder: undefined };
              }
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

  private saveExistingTemplate = async () => {
    if (!this.state.selectedCustomerId) return;
    const cleanFields = (section: "inside" | "outside", fields: TemplateField[]) => fields.map((field, index) => normalizeCounterField({
      ...field,
      key: field.key.trim() || `${section}_field_${index + 1}`,
      label: field.label.trim(),
      showOnSticker: field.showOnSticker ?? true,
      stickerOrder: field.showOnSticker === false ? undefined : field.stickerOrder ?? index,
    }));
    const inside = cleanFields("inside", this.state.templateInsideDraft);
    const outside = cleanFields("outside", this.state.templateOutsideDraft);
    if ([...inside, ...outside].some((field) => !field.label)) {
      this.setState({ templateNotice: { kind: "error", text: "กรุณากรอกชื่อ Field ให้ครบ" } });
      return;
    }
    if (
      new Set(inside.map((field) => field.key)).size !== inside.length ||
      new Set(outside.map((field) => field.key)).size !== outside.length
    ) {
      this.setState({ templateNotice: { kind: "error", text: "Key ของแต่ละ Field ต้องไม่ซ้ำกัน" } });
      return;
    }

    this.setState({ savingTemplate: true, templateNotice: undefined });
    try {
      const response = await fetch(`/api/customers/${this.state.selectedCustomerId}/template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-role": "admin" },
        body: JSON.stringify({ inside, outside, updatedBy: "ADMIN" }),
      });
      const result = (await response.json()) as { data?: CustomerTemplate; message?: string };
      if (!response.ok || !result.data) throw new Error(result.message);
      this.setState({
        templateInsideDraft: result.data.inside.map((field) => normalizeCounterField({ ...field, showOnSticker: field.showOnSticker ?? true })),
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

  private traceableField(): OutsideField {
    return {
      key: `traceable_natural_rubber_${uid()}`,
      label: "Traceable Natural Rubber",
      required: true,
      condition: { stickerType: "TNR" },
      showOnSticker: true,
      system: true,
    };
  }

  private changeStickerFields = (nextFields: StickerField[]) => {
    this.setState((current) => {
      const enabled = nextFields.includes("type");
      return {
        stickerFields: nextFields,
        tables: current.tables.map((table) => {
          const userFields = table.fields.filter((field) => !field.system);
          return {
            ...table,
            fields: enabled ? [this.traceableField(), ...userFields] : userFields,
          };
        }),
      };
    });
  };

  private toggleStickerLayout = (layout: StickerLayoutKey) => {
    this.setState((current) => ({
      stickerLayouts: {
        ...current.stickerLayouts,
        [layout]: !current.stickerLayouts[layout],
      },
    }));
  };

  private changeSegmentCount = (groupKey: InsideGroup["key"], count: number) => {
    this.setState((current) => ({
      groups: current.groups.map((group) => {
        if (group.key !== groupKey) return group;
        const segments = createSegments(groupKey, count)
          .map((segment, index) => group.segments[index] ?? segment);
        const counterIndex = segments.findIndex((segment) => segment.isCounter);
        return {
          ...group,
          segments: segments.map((segment, index) => ({
            ...segment,
            isCounter: counterIndex >= 0 ? index === counterIndex : index === 0,
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
        notice: {
          kind: "success",
          text: `เพิ่ม ${result.data.name} เรียบร้อยแล้ว (Customer ID: ${result.data.id})`,
        },
      });
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
    const hasTypeField = this.state.stickerFields.includes("type");

    return (
      <div className="customer-admin">
        <Navbar
          badge="ADM"
          title="จัดการ Customer"
          subtitle="เพิ่มลูกค้าใหม่ และแก้ไข Sticker Template ของลูกค้าเดิม"
          action={<Link className="back-link" href="/">กลับหน้าหลัก</Link>}
        />
        <main className="customer-form-wrap">
          {this.state.checkingRole && <div className="form-notice success">กำลังตรวจสอบสิทธิ์...</div>}
          {!this.state.checkingRole && !this.state.isAdmin && (
            <div className="form-notice error">เฉพาะ Admin เท่านั้นที่จัดการ Customer และ Sticker Template ได้</div>
          )}
          {!this.state.checkingRole && this.state.isAdmin && (
            <>
          <div className="customer-mode-switch">
            <button
              type="button"
              className={this.state.mode === "edit" ? "active" : ""}
              onClick={() => this.changeMode("edit")}
            >
              แก้ไข Customer
            </button>
            <button
              type="button"
              className={this.state.mode === "create" ? "active" : ""}
              onClick={() => this.changeMode("create")}
            >
              เพิ่ม Customer
            </button>
          </div>
          {this.state.mode === "edit" && (
          <section className="config-card">
            <div className="outside-title">
              <SectionHeading
                number="1"
                title="แก้ไข Sticker Template"
                subtitle="เลือก Customer เดิมเพื่อแก้ Field ที่จะไปแสดงบนสติ๊กเกอร์ในกรอบและนอกกรอบ"
              />
              <Button
                className="export-button"
                onClick={() => void this.saveExistingTemplate()}
                disabled={!this.state.selectedCustomerId || this.state.loadingTemplate}
                loading={this.state.savingTemplate}
                loadingText="กำลังบันทึก..."
              >
                บันทึก Template
              </Button>
            </div>
            {this.state.templateNotice && (
              <div className={`form-notice ${this.state.templateNotice.kind}`}>{this.state.templateNotice.text}</div>
            )}
            <label className="customer-name">
              <span>เลือก Customer</span>
              <select
                value={this.state.selectedCustomerId}
                onChange={(event) => void this.selectTemplateCustomer(event.target.value)}
                disabled={this.state.loadingCustomers || this.state.loadingTemplate}
              >
                <option value="">{this.state.loadingCustomers ? "กำลังโหลดลูกค้า..." : "เลือก Customer ที่ต้องการแก้ Template"}</option>
                {this.state.customers.map((customer) => (
                  <option value={customer.id} key={customer.id}>{customer.name}</option>
                ))}
              </select>
            </label>
            {this.state.loadingTemplate && <div className="outside-empty"><strong>กำลังโหลด Template...</strong></div>}
            {this.state.selectedCustomerId && !this.state.loadingTemplate && (
              <>
                <StickerTemplatePreview
                  customerName={this.state.customers.find((customer) => String(customer.id) === this.state.selectedCustomerId)?.name ?? "Customer"}
                  insideFields={this.state.templateInsideDraft}
                  outsideFields={this.state.templateOutsideDraft}
                  onSelect={this.setPreviewSlot}
                />
                <div className="template-manager-grid">
                  <TemplateFieldEditor
                    title="Sticker ในกรอบ"
                    section="inside"
                    fields={this.state.templateInsideDraft}
                    onChange={this.changeTemplateDraft}
                    onAdd={this.addTemplateField}
                    onRemove={this.removeTemplateField}
                  />
                  <TemplateFieldEditor
                    title="Sticker นอกกรอบ"
                    section="outside"
                    fields={this.state.templateOutsideDraft}
                    onChange={this.changeTemplateDraft}
                    onAdd={this.addTemplateField}
                    onRemove={this.removeTemplateField}
                  />
                </div>
              </>
            )}
          </section>
          )}

          {this.state.mode === "create" && (
            <>
          {this.state.notice && (
            <div className={`form-notice ${this.state.notice.kind}`}>{this.state.notice.text}</div>
          )}
          <form onSubmit={this.submit}>
            <section className="config-card">
              <SectionHeading
                number="2"
                title="เพิ่ม Customer ใหม่"
                subtitle="เลือกว่าหน้า User ต้องแสดงช่องใดให้กรอกบ้าง"
              />
              <label className="customer-name">
                <span>ชื่อลูกค้า *</span>
                <input
                  value={this.state.name}
                  onChange={(event) => this.setState({ name: event.target.value })}
                  placeholder="เช่น ABC Rubber Co., Ltd."
                />
              </label>
              <OptionGroup
                label="ช่องที่ User ต้องกรอก *"
                hint="Admin เลือกเฉพาะหัวข้อ ส่วนค่าจริงให้ User เลือกภายหลัง"
              >
                {([
                  ["side", "Side", "User เลือก 1–6"],
                  ["format", "Format", "User เลือก 5533 หรือ 555"],
                  ["type", "Type", "User เลือก TNR, NON-TNR หรือ FCS"],
                  ["other", "Other", "User เลือก Dome หรือ Inter"],
                ] as const).map(([field, label, description]) => (
                  <Choice
                    key={field}
                    label={label}
                    description={description}
                    checked={this.state.stickerFields.includes(field)}
                    onChange={() => this.changeStickerFields(
                      this.state.stickerFields.includes(field)
                        ? this.state.stickerFields.filter((item) => item !== field)
                        : [...this.state.stickerFields, field],
                    )}
                  />
                ))}
              </OptionGroup>
              <OptionGroup
                label="รูปแบบสติ๊กเกอร์ที่ต้องพิมพ์ *"
                hint="Admin เป็นคนกำหนดว่าจะออกกระดาษแบบใดให้ลูกค้ารายนี้"
              >
                {([
                  ["insideFrame", "ในกรอบ", "A4 แนวนอน 2x2"],
                  ["outsideFrame", "นอกกรอบ", "A4 แนวนอน 2x2"],
                  ["customerName", "ชื่อ Customer", "A4 แนวตั้ง 2x16"],
                ] as const).map(([layout, label, description]) => (
                  <Choice
                    key={layout}
                    label={label}
                    description={description}
                    checked={this.state.stickerLayouts[layout]}
                    onChange={() => this.toggleStickerLayout(layout)}
                  />
                ))}
              </OptionGroup>
            </section>

            <section className="config-card">
              <SectionHeading
                number="3"
                title="ข้อมูลภายในกล่อง (Inside)"
                subtitle="กำหนดจำนวนส่วนของ LOT NO. และ PALLET NO. ได้หัวข้อละ 1–6 ส่วน"
              />
              <div className="inside-grid">
                {this.state.groups.map((group) => (
                  <div className="inside-box" key={group.key}>
                    <div className="inside-box-head">
                      <strong>{group.label}</strong>
                      <label>
                        จำนวนส่วน{" "}
                        <select
                          value={group.segments.length}
                          onChange={(event) => this.changeSegmentCount(group.key, Number(event.target.value))}
                        >
                          {[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="segment-list">
                      {group.segments.map((segment, index) => (
                        <label key={segment.key}>
                          <span>{index + 1}</span>
                          <input
                            value={segment.label}
                            onChange={(event) => this.updateGroupSegment(group.key, index, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="fixed-inside">
                <div>
                  <strong>ช่องมาตรฐานที่ User ต้องกรอก</strong>
                  <small>มีในลูกค้าทุกรายและไม่ต้องตั้งค่าเพิ่มเติม</small>
                </div>
                <div className="fixed-field-list">
                  {fixedInsideFields.map((field) => (
                    <span key={field.key}>
                      {field.label}
                      <b>บังคับ</b>
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="config-card">
              <div className="outside-title">
                <SectionHeading
                  number="4"
                  title="ข้อมูลภายนอกกล่อง (Outside)"
                  subtitle="เริ่มจากกล่องว่าง เพิ่มได้ทั้ง Table และ Row"
                />
                <button
                  type="button"
                  className="outline-action"
                  onClick={() => this.setState((current) => ({
                    tables: [
                      ...current.tables,
                      {
                        id: uid(),
                        name: `Outside ${current.tables.length + 1}`,
                        fields: hasTypeField ? [this.traceableField()] : [],
                      },
                    ],
                  }))}
                >
                  + เพิ่ม Table
                </button>
              </div>
              {hasTypeField && (
                <div className="tnr-note">
                  เมื่อ User เลือก Type = TNR ระบบจะบังคับกรอก “Traceable Natural Rubber” ในทุก Outside table
                </div>
              )}
              {this.state.tables.length === 0 ? (
                <div className="outside-empty">
                  <strong>ยังไม่มี Outside table</strong>
                  <span>กด “เพิ่ม Table” เมื่อลูกค้าต้องใช้ข้อมูลภายนอกกล่อง</span>
                </div>
              ) : (
                <div className="outside-tables">
                  {this.state.tables.map((table, tableIndex) => (
                    <div className="outside-table" key={table.id}>
                      <div className="outside-table-head">
                        <span>{tableIndex + 1}</span>
                        <input
                          value={table.name}
                          onChange={(event) => this.updateTable(table.id, (item) => ({
                            ...item,
                            name: event.target.value,
                          }))}
                        />
                        <button
                          type="button"
                          onClick={() => this.setState((current) => ({
                            tables: current.tables.filter((item) => item.id !== table.id),
                          }))}
                        >
                          ลบ Table
                        </button>
                      </div>
                      <div className="outside-rows">
                        {table.fields.map((field, fieldIndex) => (
                          <div className={`outside-row ${field.system ? "system-row" : ""}`} key={field.key}>
                            <span>{fieldIndex + 1}</span>
                            <input
                              value={field.label}
                              disabled={field.system}
                              onChange={(event) => this.updateTable(table.id, (item) => ({
                                ...item,
                                fields: item.fields.map((row) => (
                                  row.key === field.key ? { ...row, label: event.target.value } : row
                                )),
                              }))}
                              placeholder="ชื่อข้อมูลบน Sticker"
                            />
                            <label>
                              <input
                                type="checkbox"
                                checked={field.required}
                                disabled={field.system}
                                onChange={(event) => this.updateTable(table.id, (item) => ({
                                  ...item,
                                  fields: item.fields.map((row) => (
                                    row.key === field.key ? { ...row, required: event.target.checked } : row
                                  )),
                                }))}
                              />
                              {" "}
                              บังคับกรอก
                            </label>
                            {field.system ? (
                              <em>เฉพาะ TNR</em>
                            ) : (
                              <button
                                type="button"
                                onClick={() => this.updateTable(table.id, (item) => ({
                                  ...item,
                                  fields: item.fields.filter((row) => row.key !== field.key),
                                }))}
                              >
                                ลบ
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="add-row"
                          onClick={() => this.updateTable(table.id, (item) => ({
                            ...item,
                            fields: [...item.fields, { key: `field_${uid()}`, label: "", required: false, showOnSticker: true }],
                          }))}
                        >
                          + เพิ่ม Row
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="form-actions">
              <Link href="/">ยกเลิก</Link>
              <button type="submit" disabled={this.state.saving}>
                {this.state.saving ? "กำลังบันทึก..." : "บันทึกลูกค้า"}
              </button>
            </div>
          </form>
            </>
          )}
            </>
          )}
        </main>
      </div>
    );
  }
}

function SectionHeading({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return <div className="config-heading"><span>{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div>;
}

function OptionGroup({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <div className="option-group"><div><strong>{label}</strong>{hint && <small>{hint}</small>}</div><div className="choice-list">{children}</div></div>;
}

function Choice({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: () => void }) {
  return <label className={`choice ${checked ? "selected" : ""}`}><input type="checkbox" checked={checked} onChange={onChange} /><span><b>{label}</b>{description && <small>{description}</small>}</span></label>;
}

function TemplateFieldEditor({
  title,
  section,
  fields,
  onChange,
  onAdd,
  onRemove,
}: {
  title: string;
  section: "inside" | "outside";
  fields: TemplateField[];
  onChange: (section: "inside" | "outside", index: number, patch: Partial<TemplateField>) => void;
  onAdd: (section: "inside" | "outside") => void;
  onRemove: (section: "inside" | "outside", index: number) => void;
}) {
  return (
    <div className="template-editor-panel">
      <div className="template-draft-heading">
        <h3>{title}</h3>
        <span>{fields.length} field</span>
      </div>
      {!fields.length && <div className="editor-empty">ยังไม่มี Field</div>}
      {fields.map((field, index) => {
        const countableField = isCounterField(field);
        return (
        <div className="editor-field-wrap" key={`${section}-${field.key}-${index}`}>
          <article className="editor-field">
            <div className="editor-number">{index + 1}</div>
            <label>
              <span>ชื่อ Field</span>
              <Input bare value={field.label} onChange={(event) => onChange(section, index, { label: event.target.value })} />
            </label>
            <label>
              <span>Key</span>
              <Input
                bare
                value={field.key}
                onChange={(event) => onChange(section, index, {
                  key: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                })}
              />
            </label>
            <label>
              <span>ชนิดข้อมูล</span>
              <Select
                bare
                value={field.type}
                onChange={(event) => onChange(section, index, { type: event.target.value as TemplateField["type"] })}
              >
                <option value="text">ข้อความ</option>
                <option value="number">ตัวเลข</option>
                <option value="date">วันที่</option>
                <option value="textarea">ข้อความหลายบรรทัด</option>
              </Select>
            </label>
            <label className="required-toggle">
              <Input
                bare
                type="checkbox"
                checked={field.required}
                onChange={(event) => onChange(section, index, { required: event.target.checked })}
              />
              <span>บังคับกรอก</span>
            </label>
            <Button className="delete-field" onClick={() => onRemove(section, index)}>ลบ</Button>
          </article>
          {!!field.segments?.length && (
            <div className="editor-segments-row">
              <span>Section</span>
              {field.segments.map((segment, segmentIndex) => (
                <label key={segment.key}>
                  <small>
                    {segmentIndex + 1}
                    {segment.isCounter ? " +1" : ""}
                  </small>
                  <div className="editor-segment-control">
                    <Input
                      bare
                      value={segment.label}
                      onChange={(event) => onChange(section, index, {
                        segments: field.segments?.map((item, itemIndex) =>
                          itemIndex === segmentIndex ? { ...item, label: event.target.value } : item,
                        ),
                      })}
                    />
                    {countableField && (
                      <button
                        type="button"
                        className={segment.isCounter ? "count-segment active" : "count-segment"}
                        onClick={() => onChange(section, index, {
                          segments: field.segments?.map((item, itemIndex) => ({
                            ...item,
                            isCounter: itemIndex === segmentIndex,
                            type: itemIndex === segmentIndex ? "number" : "text",
                          })),
                        })}
                      >
                        Count
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={(field.segments?.length ?? 0) <= 1}
                      onClick={() => {
                        const segments = field.segments?.filter((_, itemIndex) => itemIndex !== segmentIndex) ?? [];
                        const counterIndex = segments.findIndex((item) => item.isCounter);
                        onChange(section, index, {
                          segments: segments.map((item, itemIndex) => ({
                            ...item,
                            isCounter: countableField ? (counterIndex >= 0 ? itemIndex === counterIndex : itemIndex === 0) : item.isCounter,
                            type: countableField && (counterIndex >= 0 ? itemIndex === counterIndex : itemIndex === 0) ? "number" : item.type ?? "text",
                          })),
                        });
                      }}
                    >
                      ลบ
                    </button>
                  </div>
                </label>
              ))}
              <button
                type="button"
                className="add-segment-button"
                onClick={() => onChange(section, index, {
                  segments: [
                    ...(field.segments ?? []),
                    {
                      key: `${field.key}_${uid()}`,
                      label: `Section ${(field.segments?.length ?? 0) + 1}`,
                      type: "text",
                      showOnSticker: false,
                      isCounter: false,
                    },
                  ],
                })}
              >
                +1
              </button>
            </div>
          )}
        </div>
        );
      })}
      <Button className="add-field-button" onClick={() => onAdd(section)}>
        เพิ่ม Field
      </Button>
    </div>
  );
}

function StickerTemplatePreview({
  customerName,
  insideFields,
  outsideFields,
  onSelect,
}: {
  customerName: string;
  insideFields: TemplateField[];
  outsideFields: TemplateField[];
  onSelect: (section: "inside" | "outside", slotIndex: number, fieldKey: string) => void;
}) {
  return (
    <div className="sticker-preview-wrap">
      <div className="template-draft-heading">
        <h3>Preview Sticker</h3>
        <span>ตัวอย่าง 1 ดวง</span>
      </div>
      <div className="sticker-preview-grid">
        <PreviewSticker
          title="ในกรอบ"
          section="inside"
          customerName={customerName}
          fields={insideFields}
          onSelect={onSelect}
        />
        <PreviewSticker
          title="นอกกรอบ"
          section="outside"
          customerName={customerName}
          fields={outsideFields}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

function PreviewSticker({
  title,
  section,
  customerName,
  fields,
  onSelect,
}: {
  title: string;
  section: "inside" | "outside";
  customerName: string;
  fields: TemplateField[];
  onSelect: (section: "inside" | "outside", slotIndex: number, fieldKey: string) => void;
}) {
  const selectableFields = stickerSelectableFields(fields);
  const selectedFields = selectedStickerFields(fields);
  const groupedFields = groupSelectedStickerFields(selectedFields);
  const nextOrder = selectedFields.reduce((max, field) => Math.max(max, field.stickerOrder ?? 0), -1) + 1;
  return (
    <article className="sticker-preview-card">
      <header>
        <strong>{title}</strong>
        <span>{customerName}</span>
      </header>
      <dl>
        {groupedFields.map((group) => (
          <div className="sticker-preview-select-row" key={group.label}>
            <dt>{group.label}</dt>
            <dd>
              <div className="sticker-preview-section-selects">
                {group.fields.map((selected, index) => (
                  <select
                    value={selected.key}
                    key={selected.key}
                    aria-label={selected.segmentLabel ?? selected.label}
                    onChange={(event) => onSelect(section, selected.stickerOrder ?? index, event.target.value)}
                  >
                    <option value="">ไม่แสดง</option>
                    {selectableFields.map((field) => (
                      <option value={field.key} key={field.key}>{field.label}</option>
                    ))}
                  </select>
                ))}
              </div>
            </dd>
          </div>
        ))}
        <div className="sticker-preview-select-row">
          <dt>เพิ่มข้อมูล</dt>
          <dd>
            <select value="" onChange={(event) => onSelect(section, nextOrder, event.target.value)}>
              <option value="">เลือก field</option>
              {selectableFields
                .filter((field) => !field.showOnSticker)
                .map((field) => (
                  <option value={field.key} key={field.key}>{field.label}</option>
                ))}
            </select>
          </dd>
        </div>
      </dl>
    </article>
  );
}
