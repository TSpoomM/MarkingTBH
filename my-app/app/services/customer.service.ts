import {
  customerRepository,
  CustomerRepository,
} from "../repositories/customer.repository";
import type { CustomerTemplate, TemplateField } from "@/app/types/customer";
import type { CreateCustomerPayload } from "@/app/features/customers/types";

export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  private normalizeKey(label: string, index: number) {
    const key = label.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    return key || `field_${index + 1}`;
  }

  private parseSticker(value: string | null): CustomerTemplate["sticker"] {
    try {
      const parsed = JSON.parse(value ?? "") as {
        sticker?: { enabledFields?: Array<"side" | "format" | "type" | "other"> };
      };
      if (Array.isArray(parsed.sticker?.enabledFields)) {
        return { enabledFields: parsed.sticker.enabledFields };
      }
    } catch {
      // Template รุ่นเก่าไม่มี sticker configuration
    }
    return { enabledFields: ["side"] };
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
          groups?: Array<{ label?: string; segments?: Array<{ key?: string; label?: string }> }>;
          fields?: Array<Partial<TemplateField>>;
          tables?: Array<{ name?: string; fields?: Array<Partial<TemplateField>> }>;
        };
        if (section === "Inside" && Array.isArray(config.groups)) {
          const groupRows: TemplateField[] = config.groups.map((group, groupIndex) => ({
            key: `inside_group_${groupIndex + 1}`,
            label: String(group.label ?? `Inside ${groupIndex + 1}`),
            type: "text",
            required: true,
            segments: (group.segments ?? []).map((field, fieldIndex) => ({
              key: String(field.key ?? `inside_${groupIndex + 1}_${fieldIndex + 1}`),
              label: String(field.label ?? `ส่วนที่ ${fieldIndex + 1}`),
            })),
          }));
          const fixedRows: TemplateField[] = (config.fields ?? []).map((field, index) => ({
            key: String(field.key ?? `inside_fixed_${index + 1}`),
            label: String(field.label ?? `Inside ${index + 1}`),
            type: "text",
            required: true,
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
          };
        }
        const field = item as Partial<TemplateField>;
        const label = String(field.label ?? field.key ?? `Field ${index + 1}`);
        return {
          key: String(field.key ?? this.normalizeKey(label, index)),
          label,
          type: ["number", "date", "textarea"].includes(String(field.type))
            ? (field.type as TemplateField["type"])
            : "text",
          required: Boolean(field.required),
          placeholder: field.placeholder,
          defaultValue: field.defaultValue,
        };
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

  async saveOutsideTemplate(
    customerId: number,
    fields: TemplateField[],
    updatedBy: string,
  ) {
    const template = await this.repository.findLatestTemplate(customerId);
    if (!template) throw new Error("ลูกค้ารายนี้ยังไม่มี Template ในฐานข้อมูล");
    const affectedRows = await this.repository.updateOutsideTemplate(
      template.id,
      JSON.stringify(fields),
      updatedBy,
    );
    if (!affectedRows) throw new Error("อัปเดต Outside Template ไม่สำเร็จ");
    return this.getCustomerTemplate(customerId);
  }
}

export const customerService = new CustomerService(customerRepository);
