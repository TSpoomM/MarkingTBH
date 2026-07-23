import {
  findCustomers,
  findLatestTemplateByCustomer,
  updateOutsideTemplate,
} from "../repositories/customer.repository";
import type { CustomerTemplate, TemplateField } from "../types/marking";

function normalizeKey(label: string, index: number) {
  const key = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return key || `field_${index + 1}`;
}

function parseFields(
  value: string | null,
  section: "Inside" | "Outside",
  optional = false,
) {
  if (!value?.trim()) {
    if (optional) return [];
    throw new Error(`Template ${section} ยังไม่มีข้อมูล`);
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item, index): TemplateField => {
        if (typeof item === "string") {
          return {
            key: normalizeKey(item, index),
            label: item,
            type: "text",
            required: false,
          };
        }
        const field = item as Partial<TemplateField>;
        const label = String(field.label ?? field.key ?? `Field ${index + 1}`);
        return {
          key: String(field.key ?? normalizeKey(label, index)),
          label,
          type: ["number", "date", "textarea"].includes(String(field.type))
            ? (field.type as TemplateField["type"])
            : "text",
          required: Boolean(field.required),
          placeholder: field.placeholder,
          defaultValue: field.defaultValue,
        };
      });
    }
    throw new Error(`Template ${section} ต้องเป็น JSON Array`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Template")) {
      throw error;
    }
    // รองรับข้อมูลเดิมที่เก็บชื่อ field แบบคั่นด้วย comma หรือขึ้นบรรทัดใหม่
    return value
      .split(/\r?\n|,/)
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label, index) => ({
        key: normalizeKey(label, index),
        label,
        type: "text" as const,
        required: false,
      }));
  }
}

export async function getCustomers() {
  return findCustomers();
}

export async function getCustomerTemplate(customerId: number): Promise<CustomerTemplate> {
  const customers = await findCustomers();
  const customer = customers.find((item) => item.c_id === customerId);
  if (!customer) throw new Error("ไม่พบข้อมูลลูกค้า");

  const template = await findLatestTemplateByCustomer(customerId);
  if (!template) {
    throw new Error("ลูกค้ารายนี้ยังไม่มี Template ในฐานข้อมูล");
  }
  return {
    customerId,
    customerName: customer.c_name,
    templateId: template.id,
    inside: parseFields(template.inside, "Inside"),
    outside: parseFields(template.outside, "Outside", true),
  };
}

export async function saveOutsideTemplate(
  customerId: number,
  fields: TemplateField[],
  updatedBy: string,
) {
  const template = await findLatestTemplateByCustomer(customerId);
  if (!template) throw new Error("ลูกค้ารายนี้ยังไม่มี Template ในฐานข้อมูล");
  const affectedRows = await updateOutsideTemplate(
    template.id,
    JSON.stringify(fields),
    updatedBy,
  );
  if (!affectedRows) throw new Error("อัปเดต Outside Template ไม่สำเร็จ");
  return getCustomerTemplate(customerId);
}
