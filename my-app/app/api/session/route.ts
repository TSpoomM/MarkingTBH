import { NextRequest, NextResponse } from "next/server";
import { getDevAuthSession, isDevAuthBypassEnabled } from "@/app/lib/devAuth";
import { getHrkpisSessionCookieName, readHrkpisSession } from "@/app/lib/hrkpisSession";
import { adminAuthService } from "@/app/lib/adminAuth";

export async function GET(request: NextRequest) {
  if (isDevAuthBypassEnabled) {
    const session = getDevAuthSession();
    const isAdmin = await adminAuthService.isUserAdmin(session.empId);
    return NextResponse.json({
      authenticated: true,
      ...session,
      user: { role: isAdmin ? "admin" : "user" },
    });
  }

  const sessionId = request.cookies.get(getHrkpisSessionCookieName())?.value;
  const session = await readHrkpisSession(sessionId);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const isAdmin = await adminAuthService.isUserAdmin(session.empId);

  return NextResponse.json({
    authenticated: true,
    userId: session.userId,
    empId: session.empId,
    userInv: session.userInv,
    imgProfile: session.imgProfile,
    yearAssessment: session.yearAssessment,
    user: { role: isAdmin ? "admin" : "user" },
  });
}
