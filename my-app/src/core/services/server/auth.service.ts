import { createHash, timingSafeEqual } from "crypto";
import { z } from "zod";
import { userRepository, UserRepository } from "@/src/core/repositories/user.repository";

const loginSchema = z.object({
  userInv: z.string().trim().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  /**
   * Checks the submitted credentials and resolves to the session identity,
   * or null when the user does not exist or the password is wrong.
   */
  async login(payload: unknown) {
    const { userInv, password } = loginSchema.parse(payload);

    const user = await this.users.findByUserInv(userInv);
    if (!user || !this.passwordMatches(password, user.passwordInv)) return null;

    const empId = user.fs_id === null || user.fs_id === undefined ? user.userInv : String(user.fs_id).trim() || user.userInv;
    return { userInv: user.userInv, empId };
  }

  // passwordInv is stored as a SHA1 hex digest - a one-way hash, so verifying means
  // hashing the submitted password the same way and comparing, never "decoding" it back.
  private passwordMatches(rawPassword: string, storedHash: string) {
    const computed = createHash("sha1").update(rawPassword).digest("hex");
    const computedBuffer = Buffer.from(computed.toLowerCase());
    const storedBuffer = Buffer.from(storedHash.trim().toLowerCase());
    if (computedBuffer.length !== storedBuffer.length) return false;
    return timingSafeEqual(computedBuffer, storedBuffer);
  }
}

export const authService = new AuthService(userRepository);
