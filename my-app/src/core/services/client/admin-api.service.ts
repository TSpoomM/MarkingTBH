import { httpService, HttpService } from "./http.service";
import type { AdminRole, AdminUser, EmployeeOption } from "@/src/core/models/admin";

export class AdminApiService {
  constructor(private readonly http: HttpService) {}

  list(): Promise<AdminUser[]> {
    return this.http.data<AdminUser[]>("/api/admins");
  }

  listEmployees(): Promise<EmployeeOption[]> {
    return this.http.data<EmployeeOption[]>("/api/employees");
  }

  save(fsId: string, role: AdminRole) {
    return this.http.postJson<AdminUser>("/api/admins", { fsId, role });
  }

  remove(idUser: number) {
    return this.http.deleteJson("/api/admins", { idUser });
  }
}

export const adminApiService = new AdminApiService(httpService);
