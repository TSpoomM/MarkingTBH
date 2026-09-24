import { adminAuthService } from "@/src/lib/server/adminAuth";
import { employeeService } from "@/src/core/services/server/employee.service";

export const runtime = "nodejs";

class EmployeesRoute {
  async get(request: Request) {
    try {
      const access = await adminAuthService.requireAdmin(request);
      if (!access.isSuperAdmin) {
        return Response.json({ message: "เฉพาะ Super Admin เท่านั้น" }, { status: 403 });
      }

      return Response.json({ data: await employeeService.listOptions() });
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
