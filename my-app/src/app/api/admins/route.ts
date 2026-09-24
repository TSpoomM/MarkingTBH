import { ZodError } from "zod";
import { adminService } from "@/src/core/services/server/admin.service";
import { adminAuthService } from "@/src/lib/server/adminAuth";

export const runtime = "nodejs";

class AdminsRoute {
  async get(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      if (!access.isSuperAdmin) {
        return Response.json({ message: "เฉพาะ Super Admin เท่านั้น" }, { status: 403 });
      }

      return Response.json({ data: await adminService.list() });
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

      const admin = await adminService.save(await request.json(), access.userId);

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

      const admin = await adminService.remove(await request.json(), access.userId);
      if (!admin) {
        return Response.json({ message: "ไม่พบ admin ที่ต้องการลบ" }, { status: 404 });
      }

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
