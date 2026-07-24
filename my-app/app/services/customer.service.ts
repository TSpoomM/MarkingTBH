import {
  customerRepository,
  CustomerRepository,
} from "../repositories/customer.repository";
import type { CustomerTemplate, TemplateField } from "@/app/features/marking/types";

export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  private normalizeKey(label: string, index: number) {
    const key = label.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    return key || `field_${index + 1}`;
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
