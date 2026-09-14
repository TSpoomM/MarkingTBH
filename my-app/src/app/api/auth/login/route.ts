import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { z, ZodError } from "zod";
import { userRepository } from "@/src/core/repositories/user.repository";
import { authSessionService } from "@/src/lib/authSession";

export const runtime = "nodejs";

const loginSchema = z.object({
  userInv: z.string().trim().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

// passwordInv is stored as a SHA1 hex digest - a one-way hash, so verifying means
// hashing the submitted password the same way and comparing, never "decoding" it back.
function passwordMatches(rawPassword: string, storedHash: string) {
  const computed = createHash("sha1").update(rawPassword).digest("hex");
  const computedBuffer = Buffer.from(computed.toLowerCase());
  const storedBuffer = Buffer.from(storedHash.trim().toLowerCase());
  if (computedBuffer.length !== storedBuffer.length) return false;
  return timingSafeEqual(computedBuffer, storedBuffer);
}

class LoginRoute {
  async post(request: Request) {
    try {
      const { userInv, password } = loginSchema.parse(await request.json());

      const user = await userRepository.findByUserInv(userInv);
      if (!user || !passwordMatches(password, user.passwordInv)) {
        return NextResponse.json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
      }

      const empId = user.fs_id === null || user.fs_id === undefined ? user.userInv : String(user.fs_id).trim() || user.userInv;
      const response = NextResponse.json({ data: { userInv: user.userInv, empId }, message: "เข้าสู่ระบบสำเร็จ" });
      authSessionService.setCookie(response, { userInv: user.userInv, empId });
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
