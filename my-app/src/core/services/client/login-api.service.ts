import { httpService, HttpService } from "@/src/core/services/client/http.service";

export class LoginApiService {
  constructor(private readonly http: HttpService) {}

  login(userInv: string, password: string) {
    return this.http.postJson<{ userInv: string }>("/api/auth/login", { userInv, password });
  }
}

export const loginApiService = new LoginApiService(httpService);
