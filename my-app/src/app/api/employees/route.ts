import { adminAuthService } from "@/src/lib/adminAuth";
import { employeeRepository } from "@/src/core/repositories/employee.repository";

export const runtime = "nodejs";

class EmployeesRoute {
  async get(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      if (!access.isSuperAdmin) {
        return Response.json({ message: "เฉพาะ Super Admin เท่านั้น" }, { status: 403 });
      }

      return Response.json({ data: await employeeRepository.findOptions() });
    } catch (error) {
      console.error("GET /api/employees", error);
      return Response.json({ message: "โหลดรายชื่อพนักงานไม่สำเร็จ" }, { status: 500 });
    }
  }
}

const employeesRoute = new EmployeesRoute();

export async function GET(request: Request) {
  return employeesRoute.get(request);
}
