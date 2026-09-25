import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { ActionLogService } from "./actionLog.service";
import { AdminService } from "./admin.service";
import { AuthService } from "./auth.service";
import { DestinationService } from "./destination.service";
import { MarkingService } from "./marking.service";
import { LotOverlapError } from "@/src/core/errors/lotOverlapError";
import { TemplateService } from "./template.service";
import type { ActionLogger } from "@/src/lib/server/actionLogger";
import type { ActionLogRepository } from "@/src/core/repositories/actionLog.repository";
import type { AdminRepository } from "@/src/core/repositories/admin.repository";
import type { DestinationRepository } from "@/src/core/repositories/destination.repository";
import type { EmployeeRepository } from "@/src/core/repositories/employee.repository";
import type { MarkingRepository } from "@/src/core/repositories/marking.repository";
import type { TemplateRepository } from "@/src/core/repositories/template.repository";
import type { UserRepository } from "@/src/core/repositories/user.repository";

/** Builds a stand-in repository whose methods are vitest spies. */
function fake<T>(methods: Record<string, unknown>) {
  return methods as unknown as T & typeof methods;
}

const newLogger = () => fake<ActionLogger>({ log: vi.fn(async () => {}) });
const messageOf = (run: () => unknown) => {
  try {
    run();
  } catch (error) {
    return error instanceof ZodError ? error.issues[0]?.message : String(error);
  }
  return undefined;
};

describe("DestinationService", () => {
  const setup = () => {
    const repo = fake<DestinationRepository>({
      create: vi.fn(async (value: string) => ({ id: "1", value })),
      update: vi.fn(async (id: string, value: string) => (id === "missing" ? null : { id, value })),
      delete: vi.fn(async (id: string) => (id === "missing" ? null : { id, value: "OLD" })),
    });
    const logger = newLogger();
    return { repo, logger, service: new DestinationService(repo, logger) };
  };

  it("creates a destination and logs who did it", async () => {
    const { repo, logger, service } = setup();
    await expect(service.create({ value: "  osaka " }, "10180")).resolves.toEqual({ id: "1", value: "osaka" });
    expect(repo.create).toHaveBeenCalledWith("osaka");
    expect(logger.log).toHaveBeenCalledWith("10180", "เพิ่ม destination: osaka");
  });

  it("rejects a blank value before touching the repository", async () => {
    const { repo, service } = setup();
    await expect(service.create({ value: "   " }, "1")).rejects.toThrow(ZodError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("needs an id to update, reporting it as a missing destination", async () => {
    const { service } = setup();
    await expect(service.update({ value: "X" }, "1")).rejects.toMatchObject({
      issues: [expect.objectContaining({ message: "ไม่พบ destination ที่ต้องการแก้ไข" })],
    });
  });

  it("checks the value before the id, as the route always did", async () => {
    const { service } = setup();
    // Both fields are invalid; the route shows only the first issue, so the value message must lead.
    const error = await service.update({ value: " " }, "1").catch((caught: ZodError) => caught);
    expect((error as ZodError).issues[0].message).toBe("กรุณากรอก destination");
  });

  it("accepts a numeric id and logs only when something was updated", async () => {
    const { repo, logger, service } = setup();
    await service.update({ id: 7, value: "TOKYO" }, "1");
    expect(repo.update).toHaveBeenCalledWith("7", "TOKYO");
    expect(logger.log).toHaveBeenCalledTimes(1);

    await expect(service.update({ id: "missing", value: "X" }, "1")).resolves.toBeNull();
    expect(logger.log).toHaveBeenCalledTimes(1);
  });

  it("removes by id, returning null for an unknown one without logging", async () => {
    const { logger, service } = setup();
    await expect(service.remove({ id: "3" }, "1")).resolves.toEqual({ id: "3", value: "OLD" });
    expect(logger.log).toHaveBeenCalledWith("1", "ลบ destination: OLD");
    await expect(service.remove({ id: "missing" }, "1")).resolves.toBeNull();
    expect(logger.log).toHaveBeenCalledTimes(1);
  });
});

describe("AdminService", () => {
  const setup = () => {
    const repo = fake<AdminRepository>({
      upsert: vi.fn(async (input: { fsId: string; role: string }) => ({ idUser: 1, name: "N", createdDate: null, ...input })),
      deleteById: vi.fn(async (id: number) => (id === 99 ? null : { idUser: id, fsId: "5", role: "admin", name: "N", createdDate: null })),
    });
    const logger = newLogger();
    return { repo, logger, service: new AdminService(repo, logger) };
  };

  it("maps the legacy superAdmin role and trims the id", async () => {
    const { repo, logger, service } = setup();
    await service.save({ fsId: 10180, role: "superAdmin" }, "1");
    expect(repo.upsert).toHaveBeenCalledWith({ fsId: "10180", role: "super_admin" });
    expect(logger.log).toHaveBeenCalledWith("1", "เพิ่ม/แก้ไข admin: 10180 (super_admin)");
  });

  it("rejects an unknown role", async () => {
    const { service } = setup();
    await expect(service.save({ fsId: "1", role: "root" }, "1")).rejects.toThrow(ZodError);
  });

  it("requires a positive integer id to delete", async () => {
    const { repo, service } = setup();
    await expect(service.remove({ idUser: "5" }, "1")).rejects.toThrow(ZodError);
    await expect(service.remove({ idUser: 0 }, "1")).rejects.toThrow(ZodError);
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it("returns null and stays quiet when the admin does not exist", async () => {
    const { logger, service } = setup();
    await expect(service.remove({ idUser: 99 }, "1")).resolves.toBeNull();
    expect(logger.log).not.toHaveBeenCalled();
  });
});

describe("AuthService", () => {
  const sha1 = (text: string) => createHash("sha1").update(text).digest("hex");
  const service = (user: unknown) =>
    new AuthService(fake<UserRepository>({ findByUserInv: vi.fn(async () => user) }));

  it("accepts the right password and uses fs_id as the employee id", async () => {
    const auth = service({ userInv: "somchai", passwordInv: sha1("secret"), fs_id: " 10180 " });
    await expect(auth.login({ userInv: "somchai", password: "secret" })).resolves.toEqual({ userInv: "somchai", empId: "10180" });
  });

  it("compares the hash case-insensitively", async () => {
    const auth = service({ userInv: "u", passwordInv: sha1("secret").toUpperCase(), fs_id: 5 });
    await expect(auth.login({ userInv: "u", password: "secret" })).resolves.toMatchObject({ empId: "5" });
  });

  it("falls back to the username when the user has no employee id", async () => {
    for (const fs_id of [null, undefined, "  "]) {
      const auth = service({ userInv: "u", passwordInv: sha1("p"), fs_id });
      await expect(auth.login({ userInv: "u", password: "p" })).resolves.toEqual({ userInv: "u", empId: "u" });
    }
  });

  it("answers null for a wrong password or an unknown user, never revealing which", async () => {
    await expect(service({ userInv: "u", passwordInv: sha1("secret"), fs_id: 1 }).login({ userInv: "u", password: "nope" })).resolves.toBeNull();
    await expect(service(null).login({ userInv: "ghost", password: "x" })).resolves.toBeNull();
  });

  it("validates the payload with the Thai messages", async () => {
    const auth = service(null);
    await expect(auth.login({ userInv: " ", password: "x" })).rejects.toMatchObject({ issues: [expect.objectContaining({ message: "กรุณากรอกชื่อผู้ใช้" })] });
    await expect(auth.login({ userInv: "u", password: "" })).rejects.toMatchObject({ issues: [expect.objectContaining({ message: "กรุณากรอกรหัสผ่าน" })] });
  });
});

describe("ActionLogService", () => {
  it.each([
    [null, 100],
    ["50", 50],
    ["0", 1],
    ["9999", 500],
  ])("clamps limit %s to %i", async (raw, expected) => {
    const repo = fake<ActionLogRepository>({ findRecent: vi.fn(async () => []) });
    await new ActionLogService(repo).getRecent(raw);
    expect(repo.findRecent).toHaveBeenCalledWith(expected);
  });
});

describe("MarkingService", () => {
  const setup = (location: string | null = "HQ") => {
    const repo = fake<MarkingRepository>({
      findHistory: vi.fn(async () => []),
      findLastLotEnd: vi.fn(async () => 41),
    });
    const employees = fake<EmployeeRepository>({ findLocationByFsId: vi.fn(async () => location) });
    return { repo, employees, service: new MarkingService(repo, employees, fake<TemplateService>({}), fake<DestinationRepository>({})) };
  };

  it.each([[null, 100], ["20", 20], ["-5", 1], ["5000", 300]])("clamps history limit %s to %i", async (raw, expected) => {
    const { repo, service } = setup();
    await service.getHistory(raw);
    expect(repo.findHistory).toHaveBeenCalledWith(expected);
  });

  describe("parseNextLotQuery", () => {
    it("reads the template id and production year", () => {
      const { service } = setup();
      expect(service.parseNextLotQuery("12", "2026-09-02")).toEqual({ templateId: 12, productionYear: 2026 });
    });

    it.each(["abc", "0", "-3", "1.5", ""])("rejects template id %j", (id) => {
      const { service } = setup();
      expect(messageOf(() => service.parseNextLotQuery(id, "2026-09-02"))).toBe("รหัสลูกค้าไม่ถูกต้อง");
    });

    it.each(["", "not-a-date", "1999-01-01"])("rejects production date %j", (date) => {
      const { service } = setup();
      expect(messageOf(() => service.parseNextLotQuery("1", date))).toBe("Production date ไม่ถูกต้อง");
    });

    it("reports a bad template id before a bad date", () => {
      const { service } = setup();
      expect(messageOf(() => service.parseNextLotQuery("x", ""))).toBe("รหัสลูกค้าไม่ถูกต้อง");
    });
  });

  it("continues from the last lot used in the employee's branch", async () => {
    const { repo, employees, service } = setup("HQ");
    await expect(service.getNextLotStart({ templateId: 3, productionYear: 2026 }, "10180")).resolves.toBe(42);
    expect(employees.findLocationByFsId).toHaveBeenCalledWith("10180");
    expect(repo.findLastLotEnd).toHaveBeenCalledWith(3, 2026, "HQ");
  });

  it("returns null when the employee has no branch", async () => {
    const { repo, service } = setup(null);
    await expect(service.getNextLotStart({ templateId: 3, productionYear: 2026 }, "10180")).resolves.toBeNull();
    expect(repo.findLastLotEnd).not.toHaveBeenCalled();
  });

  describe("save", () => {
    const payload = (lotStart: number, lotCount = 10) => ({
      templateId: 3,
      totalLot: 0,
      stickerSides: 1,
      lotCount,
      lotStart,
      productionDate: "2026-09-24",
      contentInside: [{ production_date: "2026-09-24", destination: "MOJI" }],
      contentOutside: [],
    });
    const db = { execute: vi.fn() };
    const destinationField = { key: "destination", label: "DESTINATION", type: "text", required: true };
    const setupSave = (overlaps: boolean, location: string | null = "HQ", options = ["MOJI", "OSAKA"]) => {
      const templates = fake<TemplateService>({
        getTemplate: vi.fn(async () => ({ inside: [destinationField], outside: [] })),
      });
      const destinations = fake<DestinationRepository>({ findOptions: vi.fn(async () => options) });
      const repo = fake<MarkingRepository>({
        withLock: vi.fn(async (_name: string, task: (connection: typeof db) => Promise<unknown>) => task(db)),
        hasLotOverlap: vi.fn(async () => overlaps),
        create: vi.fn(async () => 7),
      });
      const employees = fake<EmployeeRepository>({ findLocationByFsId: vi.fn(async () => location) });
      return { repo, service: new MarkingService(repo, employees, templates, destinations) };
    };

    it("saves under one lock per customer, year and branch, using the locked connection", async () => {
      const { repo, service } = setupSave(false);
      await expect(service.save(payload(25), "10180")).resolves.toEqual({ id: 7 });
      expect(repo.withLock).toHaveBeenCalledWith("marking-lot:3:2026:HQ", expect.any(Function));
      expect(repo.hasLotOverlap).toHaveBeenCalledWith(3, 2026, "HQ", 25, 34, db);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ employeeId: "10180" }), db);
    });

    it("holds back a lot that was already used and names the range", async () => {
      const { repo, service } = setupSave(true);
      const error = await service.save(payload(11, 5), "10180").catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(LotOverlapError);
      expect(error).toMatchObject({ lotStart: 11, lotEnd: 15, message: "LOT 11-15 เคยพิมพ์ไปแล้ว" });
      expect(repo.create).not.toHaveBeenCalled();
    });

    it("saves a repeated lot without a check once the user confirmed it", async () => {
      const { repo, service } = setupSave(true);
      await expect(service.save({ ...payload(1), allowLotOverlap: true }, "10180")).resolves.toEqual({ id: 7 });
      expect(repo.hasLotOverlap).not.toHaveBeenCalled();
      expect(repo.withLock).not.toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalled();
    });

    it.each(["TOKYO", "MOJ"])("rejects the destination %j that is not in the list, before any lot check", async (destination) => {
      const { repo, service } = setupSave(false);
      const bad = { ...payload(25), contentInside: [{ destination }] };
      const message = await service.save(bad, "10180").catch((error: Error) => error.message);
      expect(message).toBe(`Inside: DESTINATION "${destination}" ไม่มีในรายการ กรุณาเลือกจากรายการ`);
      expect(repo.withLock).not.toHaveBeenCalled();
      expect(repo.create).not.toHaveBeenCalled();
    });

    it("saves a destination written in the list's own spelling", async () => {
      const { repo, service } = setupSave(false);
      await service.save({ ...payload(25), contentInside: [{ destination: " moji " }] }, "10180");
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ contentInside: [expect.objectContaining({ destination: "MOJI" })] }),
        db,
      );
    });

    it("saves without a lock when the employee has no branch", async () => {
      const { repo, service } = setupSave(true, null);
      await expect(service.save(payload(1), "10180")).resolves.toEqual({ id: 7 });
      expect(repo.withLock).not.toHaveBeenCalled();
    });
  });
});

describe("TemplateService.listSummaries", () => {
  const rows = [
    { id: 1, c_name: "Zeta", is_active: 1 },
    { id: 2, c_name: "Alpha", is_active: "0" },
    { id: 3, c_name: "Beta", is_active: "inactive" },
    { id: 4, c_name: "Gamma", is_active: null },
    { id: 5, c_name: "Delta", is_active: true },
  ];
  const service = () => new TemplateService(fake<TemplateRepository>({ findAll: vi.fn(async () => rows) }));

  it("lists active customers first by name, hiding inactive ones by default", async () => {
    const list = await service().listSummaries(false);
    expect(list.map((item) => item.name)).toEqual(["Delta", "Gamma", "Zeta"]);
  });

  it("puts inactive customers last when they are requested", async () => {
    const list = await service().listSummaries(true);
    expect(list.map((item) => [item.name, item.isActive])).toEqual([
      ["Delta", true], ["Gamma", true], ["Zeta", true], ["Alpha", false], ["Beta", false],
    ]);
  });
});
