import { z, ZodError } from "zod";
import { adminRepository } from "@/src/core/repositories/admin.repository";
import { adminAuthService } from "@/src/lib/adminAuth";
import { actionLogger } from "@/src/lib/actionLogger";

export const runtime = "nodejs";

const adminInputSchema = z.object({
  fsId: z.union([z.string(), z.number()]).transform((value) => String(value).trim()).pipe(z.string().min(1)),
  role: z.enum(["admin", "super_admin", "superAdmin"]).transform((value) => value === "superAdmin" ? "super_admin" : value),
});

const adminDeleteSchema = z.object({
  idUser: z.number().int().positive(),
});

class AdminsRoute {
  async get(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      if (!access.isSuperAdmin) {
        return Response.json({ message: "เฉพาะ Super Admin เท่านั้น" }, { status: 403 });
      }

      return Response.json({ data: await adminRepository.findAll() });
    } catch (error) {
      console.error("GET /api/admins", error);
      return Response.json({ message: "โหลดรายชื่อ admin ไม่สำเร็จ" }, { status: 500 });
    }
  }

  async post(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      if (!access.isSuperAdmin) {
        return Response.json({ message: "เฉพาะ Super Admin เท่านั้น" }, { status: 403 });
      }

      const input = adminInputSchema.parse(await request.json());
      const admin = await adminRepository.upsert(input);
      await actionLogger.log(access.userId, `เพิ่ม/แก้ไข admin: ${admin.fsId} (${admin.role})`);

      return Response.json({ data: admin, message: "บันทึก admin เรียบร้อยแล้ว" }, { status: 201 });
    } catch (error) {
      if (error instanceof ZodError) {
        return Response.json({ message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
      }

      console.error("POST /api/admins", error);
      return Response.json({ message: "บันทึก admin ไม่สำเร็จ" }, { status: 500 });
    }
  }

  async delete(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      if (!access.isSuperAdmin) {
        return Response.json({ message: "เฉพาะ Super Admin เท่านั้น" }, { status: 403 });
      }

      const input = adminDeleteSchema.parse(await request.json());
      const admin = await adminRepository.deleteById(input.idUser);
      if (!admin) {
        return Response.json({ message: "ไม่พบ admin ที่ต้องการลบ" }, { status: 404 });
      }

      await actionLogger.log(access.userId, `ลบ admin: ${admin.fsId} (${admin.role})`);
      return Response.json({ data: admin, message: "ลบ admin เรียบร้อยแล้ว" });
    } catch (error) {
      if (error instanceof ZodError) {
        return Response.json({ message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
      }

      console.error("DELETE /api/admins", error);
      return Response.json({ message: "ลบ admin ไม่สำเร็จ" }, { status: 500 });
    }
  }
}

const adminsRoute = new AdminsRoute();

export async function GET(request: Request) {
  return adminsRoute.get(request);
}

export async function POST(request: Request) {
  return adminsRoute.post(request);
}

export async function DELETE(request: Request) {
  return adminsRoute.delete(request);
}
