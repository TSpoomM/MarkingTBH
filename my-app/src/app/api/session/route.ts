import { NextRequest, NextResponse } from "next/server";
import { devAuthService, isDevAuthBypassEnabled } from "@/src/lib/devAuth";
import { hrkpisSessionService } from "@/src/lib/hrkpisSession";
import { adminAuthService } from "@/src/lib/adminAuth";

class SessionRoute {
  async get(request: NextRequest) {
    if (isDevAuthBypassEnabled) {
      const session = devAuthService.getSession();
      const isAdmin = await adminAuthService.isUserAdmin(session.empId);
      return NextResponse.json({
        authenticated: true,
        ...session,
        user: { role: isAdmin ? "admin" : "user" },
      });
    }

    const sessionId = request.cookies.get(hrkpisSessionService.getCookieName())?.value;
    const session = await hrkpisSessionService.readSession(sessionId);

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
}

const sessionRoute = new SessionRoute();

export async function GET(request: NextRequest) {
  return sessionRoute.get(request);
}
