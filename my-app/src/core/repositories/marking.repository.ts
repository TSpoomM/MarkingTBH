import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { TemplateField } from "@/src/core/models/template";
import type { CreateMarkingInput, MarkingContent, MarkingHistoryFieldMeta, MarkingHistoryItem } from "@/src/core/models/marking";
import type { Pool } from "mysql2/promise";
import { pool } from "@/src/lib/db";

type TemplateSegment = NonNullable<TemplateField["segments"]>[number];

export class MarkingRepository {
  constructor(private readonly pool: Pool) {}

  private parseContent(value: unknown): MarkingContent[] {
    try {
      const parsed = JSON.parse(String(value ?? "[]")) as MarkingContent | MarkingContent[];
      if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item === "object");
      return parsed && typeof parsed === "object" ? [parsed] : [];
    } catch {
      return [];
    }
  }

  private firstContentValue(rows: MarkingContent[], key: string) {
    return rows.find((row) => row[key])?.[key] ?? "";
  }

  private numberValue(value: unknown) {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
  }

  private normalizeKey(label: string, index: number) {
    const key = label.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    return key || `field_${index + 1}`;
  }

  private parseTemplateFields(value: unknown, section: "Inside" | "Outside"): TemplateField[] {
    try {
      const parsed: unknown = JSON.parse(String(value ?? ""));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const config = parsed as {
          groups?: Array<{ label?: string; segments?: Array<Partial<TemplateSegment>> }>;
          fields?: Array<Partial<TemplateField>>;
          tables?: Array<{ name?: string; fields?: Array<Partial<TemplateField>> }>;
        };
        if (section === "Inside" && Array.isArray(config.groups)) {
          const groups = config.groups.map((group, groupIndex): TemplateField => {
            const label = String(group.label ?? `Inside ${groupIndex + 1}`);
            return {
              key: `inside_group_${groupIndex + 1}`,
              label,
              type: "text",
              required: false,
              stickerOrder: groupIndex,
              segments: (group.segments ?? []).map((segment, segmentIndex) => ({
                key: String(segment.key ?? `inside_${groupIndex + 1}_${segmentIndex + 1}`),
                label: String(segment.label ?? `Section ${segmentIndex + 1}`),
                stickerOrder: groupIndex * 10 + segmentIndex,
              })),
            };
          });
          const fields = (config.fields ?? []).map((field, index): TemplateField => {
            const label = String(field.label ?? field.key ?? `Inside ${index + 1}`);
            return {
              key: String(field.key ?? this.normalizeKey(label, index)),
              label,
              type: "text",
              required: Boolean(field.required),
              stickerOrder: groups.length + index,
            };
          });
          return [...groups, ...fields];
        }
        if (Array.isArray(config.fields)) {
          return config.fields.map((field, index): TemplateField => {
            const label = String(field.label ?? field.key ?? `${section} ${index + 1}`);
            return {
              ...field,
              key: String(field.key ?? this.normalizeKey(label, index)),
              label,
              type: "text",
              required: Boolean(field.required),
              stickerOrder: field.stickerOrder ?? index,
              segments: field.segments?.map((segment, segmentIndex) => ({
                ...segment,
                key: String(segment.key ?? `${field.key ?? this.normalizeKey(label, index)}_${segmentIndex + 1}`),
                label: String(segment.label ?? `Section ${segmentIndex + 1}`),
                stickerOrder: segment.stickerOrder ?? (field.stickerOrder ?? index) * 10 + segmentIndex,
              })),
            };
          });
        }
        if (section === "Outside" && Array.isArray(config.tables)) {
          return config.tables.flatMap((table, tableIndex) =>
            (table.fields ?? []).map((field, fieldIndex): TemplateField => {
              const label = String(field.label ?? field.key ?? `Field ${fieldIndex + 1}`);
              return {
                ...field,
                key: String(field.key ?? `outside_${tableIndex + 1}_${fieldIndex + 1}`),
                label,
                type: "text",
                required: Boolean(field.required),
                stickerOrder: field.stickerOrder ?? fieldIndex,
                stickerGroup: String(table.name ?? `Outside ${tableIndex + 1}`),
                stickerGroupOrder: tableIndex,
              };
            }),
          );
        }
      }
      if (Array.isArray(parsed)) {
        return parsed.map((item, index): TemplateField => {
          if (typeof item === "string") {
            return {
              key: this.normalizeKey(item, index),
              label: item,
              type: "text",
              required: false,
              stickerOrder: index,
            };
          }
          const field = item as Partial<TemplateField>;
          const label = String(field.label ?? field.key ?? `${section} ${index + 1}`);
          return {
            ...field,
            key: String(field.key ?? this.normalizeKey(label, index)),
            label,
            type: "text",
            required: Boolean(field.required),
            stickerOrder: field.stickerOrder ?? index,
          };
        });
      }
    } catch {
      // History can still render raw keys when a legacy template cannot be parsed.
    }
    return [];
  }

  private buildFieldMeta(fields: TemplateField[]) {
    const meta: Record<string, MarkingHistoryFieldMeta> = {};
    fields.forEach((field, index) => {
      const order = field.stickerOrder ?? index;
      meta[field.key] = {
        label: field.label,
        parentKey: field.key,
        parentLabel: field.label,
        order,
      };
      field.segments?.forEach((segment, segmentIndex) => {
        meta[segment.key] = {
          label: segment.label,
          parentKey: field.key,
          parentLabel: field.label,
          order: segment.stickerOrder ?? order * 10 + segmentIndex,
        };
      });
    });
    return meta;
  }

  private async findHistoryFieldMeta(templateIds: number[]) {
    const uniqueIds = Array.from(new Set(templateIds.filter(Boolean)));
    if (!uniqueIds.length) return new Map<number, MarkingHistoryItem["fieldMeta"]>();
    const placeholders = uniqueIds.map(() => "?").join(",");
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT t.id, t.inside, t.outside
       FROM tb_template t
       WHERE t.id IN (${placeholders})`,
      uniqueIds,
    );
    return new Map(rows.map((row) => {
      const record = row as Record<string, unknown>;
      return [
        this.numberValue(record.id),
        {
          inside: this.buildFieldMeta(this.parseTemplateFields(record.inside, "Inside")),
          outside: this.buildFieldMeta(this.parseTemplateFields(record.outside, "Outside")),
        },
      ];
    }));
  }

  async create(input: CreateMarkingInput) {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO tb_marking
        (emp_id, cus_id, total_lot, sticker_sides, content_inside, content_outside, created_date)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        input.employeeId,
        input.templateId,
        input.totalLot,
        input.stickerSides,
        JSON.stringify(input.contentInside),
        JSON.stringify(input.contentOutside),
      ],
    );
    return result.insertId;
  }

  async findLastLotEnd(templateId: number, productionYear: number, employeeLocation: string) {
    const [rows] = await this.pool.execute<Array<RowDataPacket & { content_inside: string | null }>>(
      `SELECT l.content_inside
       FROM tb_marking l
       INNER JOIN tb_employee_list e ON TRIM(e.fs_id) = TRIM(l.emp_id)
       WHERE l.cus_id = ?
         AND TRIM(COALESCE(e.location_emp, '')) = ?
       ORDER BY l.created_date DESC`,
      [templateId, employeeLocation],
    );

    let lastLotEnd = 0;
    rows.forEach((row) => {
      try {
        const parsed = JSON.parse(row.content_inside ?? "[]") as Array<Record<string, unknown>> | Record<string, unknown>;
        const first = Array.isArray(parsed) ? parsed[0] : parsed;
        if (!first) return;
        const productionDate = String(first.production_date ?? "");
        const year = Number(productionDate.slice(0, 4));
        if (year !== productionYear) return;
        const lotEnd = Number(first.lot_end ?? 0);
        const lotStart = Number(first.lot_start ?? 0);
        const lotCount = Number(first.lot_count ?? 0);
        lastLotEnd = Math.max(lastLotEnd, lotEnd || (lotStart && lotCount ? lotStart + lotCount - 1 : 0));
      } catch {
        // Ignore old rows without JSON metadata.
      }
    });
    return lastLotEnd;
  }

  async findHistory(limit = 100): Promise<MarkingHistoryItem[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT l.*, t.c_name, e.emp_name, e.emp_name_en, e.location_emp
       FROM tb_marking l
       LEFT JOIN tb_template t ON t.id = (
         SELECT latest_template.id
         FROM tb_template latest_template
         WHERE latest_template.id = l.cus_id
         ORDER BY latest_template.created_date DESC, latest_template.id DESC
         LIMIT 1
       )
       LEFT JOIN tb_employee_list e ON TRIM(e.fs_id) = TRIM(l.emp_id)
       ORDER BY l.created_date DESC
       LIMIT ?`,
      [limit],
    );

    const fieldMetaByTemplate = await this.findHistoryFieldMeta(rows.map((row) => this.numberValue(row.cus_id)));

    return rows.map((row, index) => {
      const record = row as Record<string, unknown>;
      const inside = this.parseContent(record.content_inside);
      const outside = this.parseContent(record.content_outside);
      const lotStart = this.numberValue(this.firstContentValue(inside, "lot_start"));
      const lotCount = this.numberValue(this.firstContentValue(inside, "lot_count")) || this.numberValue(record.total_lot);
      const lotEnd = this.numberValue(this.firstContentValue(inside, "lot_end")) || (lotStart && lotCount ? lotStart + lotCount - 1 : 0);
      const actionType = this.firstContentValue(inside, "action_type");

      return {
        id: String(record.id ?? record.log_id ?? record.marking_id ?? index + 1),
        employeeId: String(record.emp_id ?? ""),
        employeeName: String(record.emp_name ?? record.emp_name_en ?? record.emp_id ?? ""),
        employeeLocation: String(record.location_emp ?? ""),
        templateId: this.numberValue(record.cus_id),
        customerName: String(record.c_name ?? ""),
        totalLot: this.numberValue(record.total_lot),
        stickerSides: this.numberValue(record.sticker_sides),
        lotStart,
        lotEnd,
        lotCount,
        productionDate: this.firstContentValue(inside, "production_date"),
        actionType: actionType === "save" || actionType === "print" ? actionType : "unknown",
        stickerFormat: this.firstContentValue(inside, "sticker_format"),
        stickerType: this.firstContentValue(inside, "sticker_type"),
        stickerFsc: this.firstContentValue(inside, "sticker_fsc") === "YES",
        stickerOther: this.firstContentValue(inside, "sticker_other"),
        createdDate: record.created_date instanceof Date
          ? record.created_date.toISOString()
          : String(record.created_date ?? ""),
        inside,
        outside,
        fieldMeta: fieldMetaByTemplate.get(this.numberValue(record.cus_id)),
      };
    });
  }
}

export const markingRepository = new MarkingRepository(pool);
