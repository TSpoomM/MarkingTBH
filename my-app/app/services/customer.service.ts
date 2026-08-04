import {
  customerRepository,
  CustomerRepository,
} from "../repositories/customer.repository";
import type { CounterType, CustomerTemplate, TemplateField } from "@/app/types/customer";
import { DEFAULT_STICKER_LAYOUTS, type CreateCustomerPayload } from "@/app/types/customer-form";

export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  private normalizeKey(label: string, index: number) {
    const key = label.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    return key || `field_${index + 1}`;
  }

  private isCounterField(field: Pick<TemplateField, "key" | "label">) {
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    return key.includes("lot") || key.includes("pallet") || label.includes("lot") || label.includes("pallet");
  }

  private counterType(field: Pick<TemplateField, "key" | "label">): CounterType {
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    return key.includes("pallet") || label.includes("pallet") ? "pallet" : "lot";
  }

  private normalizeCounterSegments(field: TemplateField): TemplateField {
    if (!field.segments?.length || !this.isCounterField(field)) return field;
    const counterIndex = field.segments.findIndex((segment) => segment.isCounter);
    return {
      ...field,
      segments: field.segments.map((segment, index) => ({
        ...segment,
        isCounter: counterIndex >= 0 ? index === counterIndex : index === 0,
        type: (counterIndex >= 0 ? index === counterIndex : index === 0) ? "number" : segment.type ?? "text",
        counterType: (counterIndex >= 0 ? index === counterIndex : index === 0)
          ? segment.counterType ?? this.counterType(field)
          : segment.counterType,
        showOnSticker: (counterIndex >= 0 ? index === counterIndex : index === 0)
          ? true
          : segment.showOnSticker,
      })),
    };
  }

  private parseSticker(value: string | null): CustomerTemplate["sticker"] {
    try {
      const parsed = JSON.parse(value ?? "") as {
        sticker?: {
          enabledFields?: Array<"side" | "format" | "type" | "other">;
          layouts?: Partial<CustomerTemplate["sticker"]["layouts"]>;
        };
      };
      if (Array.isArray(parsed.sticker?.enabledFields)) {
        return {
          enabledFields: parsed.sticker.enabledFields,
          layouts: {
            ...DEFAULT_STICKER_LAYOUTS,
            ...parsed.sticker.layouts,
          },
        };
      }
    } catch {
      // Template รุ่นเก่าไม่มี sticker configuration
    }
    return { enabledFields: ["side"], layouts: DEFAULT_STICKER_LAYOUTS };
  }

  private parseFields(
    value: string | null,
    section: "Inside" | "Outside",
    optional = false,
  ): TemplateField[] {
    if (!value?.trim()) {
      if (optional) return [];
      throw new Error(`Template ${section} ยังไม่มีข้อมูล`);
    }
    try {
      const parsed: unknown = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const config = parsed as {
          groups?: Array<{ label?: string; segments?: Array<{ key?: string; label?: string; isCounter?: boolean; counterType?: CounterType }> }>;
          fields?: Array<Partial<TemplateField>>;
          tables?: Array<{ name?: string; fields?: Array<Partial<TemplateField>> }>;
        };
        if (section === "Inside" && Array.isArray(config.fields) && !Array.isArray(config.groups)) {
          return config.fields.map((field, index): TemplateField => {
            const label = String(field.label ?? field.key ?? `Inside ${index + 1}`);
            return this.normalizeCounterSegments({
              key: String(field.key ?? this.normalizeKey(label, index)),
              label,
              type: ["number", "date", "textarea"].includes(String(field.type))
                ? (field.type as TemplateField["type"])
                : "text",
              required: Boolean(field.required),
              placeholder: field.placeholder,
              defaultValue: field.defaultValue,
              segments: field.segments?.map((segment, segmentIndex) => ({
                ...segment,
                showOnSticker: segment.showOnSticker ?? field.showOnSticker ?? true,
                stickerOrder: segment.stickerOrder ?? (field.stickerOrder ?? index) * 10 + segmentIndex,
                type: segment.type,
                isCounter: segment.isCounter,
              })),
              condition: field.condition,
              showOnSticker: field.showOnSticker ?? true,
              stickerOrder: field.stickerOrder ?? index,
            });
          });
        }
        if (section === "Inside" && Array.isArray(config.groups)) {
          const groupRows: TemplateField[] = config.groups.map((group, groupIndex) => {
            const label = String(group.label ?? `Inside ${groupIndex + 1}`);
            return this.normalizeCounterSegments({
              key: `inside_group_${groupIndex + 1}`,
              label,
              type: "text",
              required: true,
              showOnSticker: true,
              stickerOrder: groupIndex,
              segments: (group.segments ?? []).map((field, fieldIndex) => ({
                key: String(field.key ?? `inside_${groupIndex + 1}_${fieldIndex + 1}`),
                label: String(field.label ?? `Section ${fieldIndex + 1}`),
                showOnSticker: true,
                stickerOrder: groupIndex * 10 + fieldIndex,
                type: field.isCounter ? "number" : "text",
                isCounter: field.isCounter,
                counterType: field.counterType,
              })),
            });
          });
          const fixedRows: TemplateField[] = (config.fields ?? []).map((field, index) => ({
            key: String(field.key ?? `inside_fixed_${index + 1}`),
            label: String(field.label ?? `Inside ${index + 1}`),
            type: "text",
            required: true,
            showOnSticker: true,
            stickerOrder: groupRows.length + index,
          }));
          return [...groupRows, ...fixedRows];
        }
        if (section === "Outside" && Array.isArray(config.tables)) {
          return config.tables.flatMap((table, tableIndex) =>
            (table.fields ?? []).map((field, fieldIndex) => ({
              key: String(field.key ?? `outside_${tableIndex + 1}_${fieldIndex + 1}`),
              label: `${table.name ?? `Outside ${tableIndex + 1}`} — ${field.label ?? `Field ${fieldIndex + 1}`}`,
              type: "text" as const,
              required: Boolean(field.required),
              condition: field.condition,
              showOnSticker: field.showOnSticker ?? true,
              stickerOrder: field.stickerOrder ?? fieldIndex,
              stickerGroup: String(table.name ?? `Outside ${tableIndex + 1}`),
              stickerGroupOrder: tableIndex,
            })),
          );
        }
      }
      if (!Array.isArray(parsed)) throw new Error(`Template ${section} ต้องเป็น JSON Array`);
      return parsed.map((item, index): TemplateField => {
        if (typeof item === "string") {
          return {
            key: this.normalizeKey(item, index),
            label: item,
            type: "text",
            required: false,
            showOnSticker: true,
            stickerOrder: index,
          };
        }
        const field = item as Partial<TemplateField>;
        const label = String(field.label ?? field.key ?? `Field ${index + 1}`);
        return this.normalizeCounterSegments({
          key: String(field.key ?? this.normalizeKey(label, index)),
          label,
          type: ["number", "date", "textarea"].includes(String(field.type))
            ? (field.type as TemplateField["type"])
            : "text",
          required: Boolean(field.required),
          placeholder: field.placeholder,
          defaultValue: field.defaultValue,
          segments: field.segments?.map((segment, segmentIndex) => ({
            ...segment,
            showOnSticker: segment.showOnSticker ?? field.showOnSticker ?? true,
            stickerOrder: segment.stickerOrder ?? (field.stickerOrder ?? index) * 10 + segmentIndex,
            type: segment.type,
            isCounter: segment.isCounter,
          })),
          showOnSticker: field.showOnSticker ?? true,
          stickerOrder: field.stickerOrder ?? index,
          stickerGroup: field.stickerGroup,
          stickerGroupOrder: field.stickerGroupOrder,
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Template")) throw error;
      return value.split(/\r?\n|,/)
        .map((label) => label.trim())
        .filter(Boolean)
        .map((label, index) => ({
          key: this.normalizeKey(label, index),
          label,
          type: "text" as const,
          required: false,
          showOnSticker: true,
          stickerOrder: index,
        }));
    }
  }

  getCustomers() {
    return this.repository.findAll();
  }

  async createCustomer(input: CreateCustomerPayload, createdBy: string) {
    const customerId = await this.repository.createWithTemplate(
      input.name.trim(),
      JSON.stringify({
        version: input.configuration.version,
        sticker: input.configuration.sticker,
        groups: input.configuration.inside.groups,
        fields: input.configuration.inside.fields,
      }),
      JSON.stringify({
        version: input.configuration.version,
        tables: input.configuration.outside.tables,
      }),
      createdBy,
    );
    return { id: customerId, name: input.name.trim() };
  }

  async getCustomerTemplate(customerId: number): Promise<CustomerTemplate> {
    const customers = await this.repository.findAll();
    const customer = customers.find((item) => item.c_id === customerId);
    if (!customer) throw new Error("ไม่พบข้อมูลลูกค้า");

    const template = await this.repository.findLatestTemplate(customerId);
    if (!template) throw new Error("ลูกค้ารายนี้ยังไม่มี Template ในฐานข้อมูล");
    return {
      customerId,
      customerName: customer.c_name,
      templateId: template.id,
      sticker: this.parseSticker(template.inside),
      inside: this.parseFields(template.inside, "Inside"),
      outside: this.parseFields(template.outside, "Outside", true),
    };
  }

  private buildInsideTemplateJson(
    previousInside: string | null,
    fields: TemplateField[],
    stickerPatch?: Partial<CustomerTemplate["sticker"]>,
  ) {
    const currentSticker = this.parseSticker(previousInside);
    const sticker = {
      ...currentSticker,
      ...stickerPatch,
      layouts: {
        ...currentSticker.layouts,
        ...stickerPatch?.layouts,
      },
    };
    return JSON.stringify({
      version: 2,
      sticker,
      fields,
    });
  }

  async saveTemplate(
    customerId: number,
    insideFields: TemplateField[],
    fields: TemplateField[],
    sticker: Partial<CustomerTemplate["sticker"]> | undefined,
    updatedBy: string,
  ) {
    const template = await this.repository.findLatestTemplate(customerId);
    if (!template) throw new Error("ลูกค้ารายนี้ยังไม่มี Template ในฐานข้อมูล");
    const affectedRows = await this.repository.updateTemplate(
      template.id,
      this.buildInsideTemplateJson(template.inside, insideFields, sticker),
      JSON.stringify(fields),
      updatedBy,
    );
    if (!affectedRows) throw new Error("อัปเดต Template ไม่สำเร็จ");
    return this.getCustomerTemplate(customerId);
  }
}

export const customerService = new CustomerService(customerRepository);
