import { markingRepository } from "@/app/repositories/marking.repository";
import { employeeRepository } from "@/app/repositories/employee.repository";
import { getRequestCurrentUserId } from "@/app/lib/requestCurrentUser";

export const runtime = "nodejs";

type NextLotRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: NextLotRouteContext) {
  try {
    const { id } = await context.params;
    const customerId = Number(id);
    const { searchParams } = new URL(request.url);
    const productionDate = searchParams.get("productionDate") ?? "";
    const productionYear = Number(productionDate.slice(0, 4));

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return Response.json({ message: "รหัสลูกค้าไม่ถูกต้อง" }, { status: 400 });
    }
    if (!Number.isInteger(productionYear) || productionYear < 2000) {
      return Response.json({ message: "Production date ไม่ถูกต้อง" }, { status: 400 });
    }

    const employeeId = await getRequestCurrentUserId(request);
    const employeeLocation = employeeId ? await employeeRepository.findLocationByFsId(employeeId) : null;
    if (!employeeLocation) {
      return Response.json({ message: "ไม่พบสาขาของผู้ใช้" }, { status: 400 });
    }

    const lastLotEnd = await markingRepository.findLastLotEnd(customerId, productionYear, employeeLocation);
    return Response.json({ data: { lotStart: lastLotEnd + 1 } });
  } catch (error) {
    console.error("GET /api/customers/[id]/next-lot", error);
    return Response.json({ message: "โหลดเลข LOT ถัดไปไม่สำเร็จ" }, { status: 500 });
  }
}
