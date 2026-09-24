import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authService } from "@/src/core/services/server/auth.service";
import { authSessionService } from "@/src/lib/server/authSession";

export const runtime = "nodejs";

class LoginRoute {
  async post(request: Request) {
    try {
      const identity = await authService.login(await request.json());
      if (!identity) {
        return NextResponse.json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
      }

      const response = NextResponse.json({ data: identity, message: "เข้าสู่ระบบสำเร็จ" });
      authSessionService.setCookie(response, identity);
      return response;
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json({ message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
      }
      console.error("POST /api/auth/login", error);
      return NextResponse.json({ message: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
    }
  }
}

const loginRoute = new LoginRoute();

export async function POST(request: Request) {
  return loginRoute.post(request);
}
