import { z, ZodError } from "zod";
import { destinationRepository } from "@/src/core/repositories/destination.repository";
import { adminAuthService } from "@/src/lib/adminAuth";
import { actionLogger } from "@/src/lib/actionLogger";

export const runtime = "nodejs";

const destinationInputSchema = z.object({
  id: z.union([z.string(), z.number()]).optional().transform((value) => value == null ? "" : String(value).trim()),
  value: z.string().trim().min(1, "กรุณากรอก destination"),
});

const destinationDeleteSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((value) => String(value).trim()).pipe(z.string().min(1)),
});

class DestinationsRoute {
  async get(request: Request) {
    try {
      const url = new URL(request.url);
      if (url.searchParams.get("manage") === "1") {
        await adminAuthService.requireAdmin(request);
        return Response.json({ data: await destinationRepository.findAll() });
      }
      return Response.json({ data: await destinationRepository.findOptions() });
    } catch (error) {
      console.error("GET /api/destinations", error);
      const message = error instanceof Error ? error.message : "โหลด destination ไม่สำเร็จ";
      return Response.json({ message }, { status: 500 });
    }
  }

  async post(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      const input = destinationInputSchema.parse(await request.json());
      const destination = await destinationRepository.create(input.value);
      await actionLogger.log(access.userId, `เพิ่ม destination: ${destination.value}`);

      return Response.json({ data: destination, message: "บันทึก destination เรียบร้อยแล้ว" }, { status: 201 });
    } catch (error) {
      if (error instanceof ZodError) {
        return Response.json({ message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
      }

      console.error("POST /api/destinations", error);
      const message = error instanceof Error ? error.message : "บันทึก destination ไม่สำเร็จ";
      return Response.json({ message }, { status: 500 });
    }
  }

  async put(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      const input = destinationInputSchema.parse(await request.json());
      if (!input.id) return Response.json({ message: "ไม่พบ destination ที่ต้องการแก้ไข" }, { status: 400 });

      const destination = await destinationRepository.update(input.id, input.value);
      if (!destination) return Response.json({ message: "ไม่พบ destination ที่ต้องการแก้ไข" }, { status: 404 });

      await actionLogger.log(access.userId, `แก้ไข destination: ${destination.value}`);
      return Response.json({ data: destination, message: "บันทึก destination เรียบร้อยแล้ว" });
    } catch (error) {
      if (error instanceof ZodError) {
        return Response.json({ message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
      }

      console.error("PUT /api/destinations", error);
      const message = error instanceof Error ? error.message : "บันทึก destination ไม่สำเร็จ";
      return Response.json({ message }, { status: 500 });
    }
  }

  async delete(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      const input = destinationDeleteSchema.parse(await request.json());
      const destination = await destinationRepository.delete(input.id);
      if (!destination) return Response.json({ message: "ไม่พบ destination ที่ต้องการลบ" }, { status: 404 });

      await actionLogger.log(access.userId, `ลบ destination: ${destination.value}`);
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
