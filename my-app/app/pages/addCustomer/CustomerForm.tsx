"use client";

import Link from "next/link";
import { Component, type FormEvent, type ReactNode } from "react";
import Navbar from "@/app/components/Navbar";
import {
  type CreateCustomerPayload,
  type InsideGroup,
  type OutsideField,
  type OutsideTable,
  type StickerField,
} from "@/app/types/customer-form";

const createSegments = (group: InsideGroup["key"], count: number) =>
  Array.from({ length: count }, (_, index) => ({
    key: `${group}_${index + 1}`,
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

interface CustomerFormState {
  name: string;
  stickerFields: StickerField[];
  groups: InsideGroup[];
  tables: OutsideTable[];
  notice: CustomerFormNotice | undefined;
  saving: boolean;
}

export default class CustomerForm extends Component<Record<string, never>, CustomerFormState> {
  state: CustomerFormState = {
    name: "",
    stickerFields: [],
    groups: initialGroups.map((group) => ({
      ...group,
      segments: group.segments.map((segment) => ({ ...segment })),
    })),
    tables: [],
    notice: undefined,
    saving: false,
  };

  private traceableField(): OutsideField {
    return {
      key: `traceable_natural_rubber_${uid()}`,
      label: "Traceable Natural Rubber",
      required: true,
      condition: { stickerType: "TNR" },
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

  private changeSegmentCount = (groupKey: InsideGroup["key"], count: number) => {
    this.setState((current) => ({
      groups: current.groups.map((group) => {
        if (group.key !== groupKey) return group;
        const segments = createSegments(groupKey, count)
          .map((segment, index) => group.segments[index] ?? segment);
        return { ...group, segments };
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
        sticker: { enabledFields: this.state.stickerFields },
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
          title="เพิ่ม Customer"
          subtitle="กำหนด Sticker, Inside และ Outside สำหรับลูกค้าใหม่"
          action={<Link className="back-link" href="/">กลับหน้าหลัก</Link>}
        />
        <main className="customer-form-wrap">
          {this.state.notice && (
            <div className={`form-notice ${this.state.notice.kind}`}>{this.state.notice.text}</div>
          )}
          <form onSubmit={this.submit}>
            <section className="config-card">
              <SectionHeading
                number="1"
                title="รายละเอียดสติ๊กเกอร์"
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
            </section>

            <section className="config-card">
              <SectionHeading
                number="2"
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
                  number="3"
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
                            fields: [...item.fields, { key: `field_${uid()}`, label: "", required: false }],
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
