import { ZodError } from "zod";
import { markingService } from "@/app/services/marking.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const result = await markingService.save(await request.json());
    return Response.json(
      { data: result, message: "บันทึกข้อมูลเรียบร้อยแล้ว" },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/markings", error);
    return Response.json({ message: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

