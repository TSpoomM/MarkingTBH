import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { TemplateField } from "@/src/core/models/template";
import type { CreateMarkingInput, MarkingContent, MarkingHistoryFieldMeta, MarkingHistoryItem } from "@/src/core/models/marking";
import type { Pool } from "mysql2/promise";
import { pool } from "@/src/lib/server/db";
import { UserFacingError } from "@/src/core/errors/userFacingError";

type TemplateSegment = NonNullable<TemplateField["segments"]>[number];

/** Anything that can run a prepared statement: the pool, or one connection taken from it. */
type Queryable = Pick<Pool, "execute">;


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

  private parsePrintSections(value: unknown): CreateMarkingInput["printSections"] {
    if (!value) return undefined;
    if (typeof value === "object") return value as CreateMarkingInput["printSections"];
    try {
      return JSON.parse(String(value));
    } catch {
      return undefined;
    }
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
        group: field.stickerGroup,
        groupOrder: field.stickerGroupOrder,
      };
      field.segments?.forEach((segment, segmentIndex) => {
        meta[segment.key] = {
          label: segment.label,
          parentKey: field.key,
          parentLabel: field.label,
          order: segment.stickerOrder ?? order * 10 + segmentIndex,
          group: field.stickerGroup,
          groupOrder: field.stickerGroupOrder,
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

  /**
   * Runs `task` while holding a named database lock, so saves for the same key never run together.
   * It does not wait: when someone else holds the lock, this fails at once and the user tries again.
   * The task gets the locked connection: using the pool inside it could wait for a connection that
   * other callers, blocked on this same lock, are holding.
   */
  async withLock<T>(name: string, task: (db: Queryable) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query<Array<RowDataPacket & { acquired: number | null }>>(
        "SELECT GET_LOCK(?, 0) AS acquired",
        [name],
      );
      if (Number(rows[0]?.acquired) !== 1) throw new UserFacingError("มีคนกำลังพิมพ์ Template เดียวกันอยู่ กรุณาลองอีกครั้ง");
      try {
        return await task(connection);
      } finally {
        await connection.query("SELECT RELEASE_LOCK(?)", [name]);
      }
    } finally {
      connection.release();
    }
  }

  async create(input: CreateMarkingInput, db: Queryable = this.pool) {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO tb_marking
        (emp_id, cus_id, total_lot, sticker_sides, content_inside, content_outside, print_sections, created_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        input.employeeId,
        input.templateId,
        input.totalLot,
        input.stickerSides,
        JSON.stringify(input.contentInside),
        JSON.stringify(input.contentOutside),
        input.printSections ? JSON.stringify(input.printSections) : null,
      ],
    );
    return result.insertId;
  }

  /**
   * Ids of the branch's employees as they appear in tb_marking.emp_id (an integer column).
   * A fs_id that is not a plain integer, such as "007", never matched an emp_id and still does not.
   */
  private async findBranchEmployeeIds(employeeLocation: string, db: Queryable) {
    const [employees] = await db.execute<Array<RowDataPacket & { fs_id: string | null }>>(
      "SELECT fs_id FROM tb_employee_list WHERE TRIM(COALESCE(location_emp, '')) = ?",
      [employeeLocation],
    );
    return employees
      .map((employee) => String(employee.fs_id ?? "").trim())
      .filter((fsId) => String(Number(fsId)) === fsId)
      .map(Number);
  }

  /**
   * Reads tb_marking.lot_year / lot_start_no / lot_end_no (see db/001_marking_lot_columns.sql), so the
   * JSON of past markings is never loaded. Matching employees in code avoids a TRIM() join that cannot use an index.
   */
  async findLastLotEnd(templateId: number, productionYear: number, employeeLocation: string, db: Queryable = this.pool) {
    const employeeIds = await this.findBranchEmployeeIds(employeeLocation, db);
    if (!employeeIds.length) return 0;
    const [rows] = await db.execute<Array<RowDataPacket & { last_lot_end: number | null }>>(
      `SELECT MAX(lot_end_no) AS last_lot_end
       FROM tb_marking
       WHERE cus_id = ? AND lot_year = ? AND emp_id IN (${employeeIds.map(() => "?").join(",")})`,
      [templateId, productionYear, ...employeeIds],
    );
    return Number(rows[0]?.last_lot_end ?? 0);
  }

  /** Whether any earlier marking of the customer, branch and year already used a lot in lotStart..lotEnd. */
  async hasLotOverlap(
    templateId: number,
    productionYear: number,
    employeeLocation: string,
    lotStart: number,
    lotEnd: number,
    db: Queryable = this.pool,
  ) {
    const employeeIds = await this.findBranchEmployeeIds(employeeLocation, db);
    if (!employeeIds.length) return false;
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT 1
       FROM tb_marking
       WHERE cus_id = ? AND lot_year = ? AND emp_id IN (${employeeIds.map(() => "?").join(",")})
         AND lot_end_no > 0 AND lot_end_no >= ? AND IF(lot_start_no > 0, lot_start_no, lot_end_no) <= ?
       LIMIT 1`,
      [templateId, productionYear, ...employeeIds, lotStart, lotEnd],
    );
    return rows.length > 0;
  }

  async findHistory(limit = 100): Promise<MarkingHistoryItem[]> {
    // Employees are matched in code (a TRIM() join cannot use an index); the list is small.
    const [[rows], [employeeRows]] = await Promise.all([
      this.pool.execute<RowDataPacket[]>(
        // Cut to the newest rows first so the join only runs for the rows that are returned.
        `SELECT l.*, t.c_name
         FROM (SELECT * FROM tb_marking ORDER BY created_date DESC LIMIT ?) l
         LEFT JOIN tb_template t ON t.id = l.cus_id
         ORDER BY l.created_date DESC`,
        [limit],
      ),
      this.pool.execute<RowDataPacket[]>(
        "SELECT fs_id, emp_name, emp_name_en, location_emp FROM tb_employee_list",
      ),
    ]);
    const employeesByFsId = new Map<string, RowDataPacket>();
    employeeRows.forEach((employee) => {
      const fsId = String(employee.fs_id ?? "").trim();
      if (!employeesByFsId.has(fsId)) employeesByFsId.set(fsId, employee);
    });
    rows.forEach((row) => {
      Object.assign(row, employeesByFsId.get(String(row.emp_id ?? "").trim()));
    });

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
        printSections: this.parsePrintSections(record.print_sections),
      };
    });
  }
}

export const markingRepository = new MarkingRepository(pool);
