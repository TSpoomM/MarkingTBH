import { ZodError } from "zod";
import { destinationService } from "@/src/core/services/server/destination.service";
import { adminAuthService } from "@/src/lib/server/adminAuth";
import { clientMessage } from "@/src/lib/server/apiError";

export const runtime = "nodejs";

class DestinationsRoute {
  async get(request: Request) {
    try {
      const url = new URL(request.url);
      if (url.searchParams.get("manage") === "1") {
        await adminAuthService.requireAdmin(request);
        return Response.json({ data: await destinationService.listAll() });
      }
      return Response.json({ data: await destinationService.listOptions() });
    } catch (error) {
      console.error("GET /api/destinations", error);
      return Response.json({ message: "โหลด destination ไม่สำเร็จ" }, { status: 500 });
    }
  }

  async post(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      const destination = await destinationService.create(await request.json(), access.userId);

      return Response.json({ data: destination, message: "บันทึก destination เรียบร้อยแล้ว" }, { status: 201 });
    } catch (error) {
      if (error instanceof ZodError) {
        return Response.json({ message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
      }

      console.error("POST /api/destinations", error);
      return Response.json({ message: clientMessage(error, "บันทึก destination ไม่สำเร็จ") }, { status: 500 });
    }
  }

  async put(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      const destination = await destinationService.update(await request.json(), access.userId);
      if (!destination) return Response.json({ message: "ไม่พบ destination ที่ต้องการแก้ไข" }, { status: 404 });

      return Response.json({ data: destination, message: "บันทึก destination เรียบร้อยแล้ว" });
    } catch (error) {
      if (error instanceof ZodError) {
        return Response.json({ message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
      }

      console.error("PUT /api/destinations", error);
      return Response.json({ message: clientMessage(error, "บันทึก destination ไม่สำเร็จ") }, { status: 500 });
    }
  }

  async delete(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      const destination = await destinationService.remove(await request.json(), access.userId);
      if (!destination) return Response.json({ message: "ไม่พบ destination ที่ต้องการลบ" }, { status: 404 });

      return Response.json({ data: destination, message: "ลบ destination เรียบร้อยแล้ว" });
    } catch (error) {
      if (error instanceof ZodError) {
        return Response.json({ message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
      }

      console.error("DELETE /api/destinations", error);
      return Response.json({ message: "ลบ destination ไม่สำเร็จ" }, { status: 500 });
    }
  }
}

const destinationsRoute = new DestinationsRoute();

export async function GET(request: Request) {
  return destinationsRoute.get(request);
}

export async function POST(request: Request) {
  return destinationsRoute.post(request);
}

export async function PUT(request: Request) {
  return destinationsRoute.put(request);
}

export async function DELETE(request: Request) {
  return destinationsRoute.delete(request);
}
