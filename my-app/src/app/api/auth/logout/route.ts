import { NextResponse } from "next/server";
import { authSessionService } from "@/src/lib/authSession";

class LogoutRoute {
  async post() {
    const response = NextResponse.json({ message: "ออกจากระบบแล้ว" });
    authSessionService.clearCookie(response);
    return response;
  }
}

const logoutRoute = new LogoutRoute();

export async function POST() {
  return logoutRoute.post();
}
