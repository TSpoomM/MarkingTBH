import { NextRequest, NextResponse } from "next/server";
import { devAuthService, isDevAuthBypassEnabled } from "@/src/lib/devAuth";
import { hrkpisSessionService } from "@/src/lib/hrkpisSession";
import { authSessionService } from "@/src/lib/authSession";
import { adminAuthService } from "@/src/lib/adminAuth";

class SessionRoute {
  async get(request: NextRequest) {
    if (isDevAuthBypassEnabled) {
      const session = devAuthService.getSession();
      const role = await adminAuthService.getUserRole(session.empId);
      return NextResponse.json({
        authenticated: true,
        ...session,
        user: { role: role ?? "user" },
      });
    }

    const appSessionCookie = request.cookies.get(authSessionService.getCookieName())?.value;
    const appSession = authSessionService.readFromCookieValue(appSessionCookie);
    if (appSession) {
      const empId = appSession.empId || appSession.userInv;
      const role = await adminAuthService.getUserRole(empId);
      return NextResponse.json({
        authenticated: true,
        userId: empId,
        empId,
        userInv: appSession.userInv,
        user: { role: role ?? "user" },
      });
    }

    const sessionId = request.cookies.get(hrkpisSessionService.getCookieName())?.value;
    const session = await hrkpisSessionService.readSession(sessionId);

    if (!session) {
      const response = NextResponse.json({ authenticated: false }, { status: 401 });
      if (appSessionCookie) authSessionService.clearCookie(response);
      return response;
    }

    const role = await adminAuthService.getUserRole(session.empId);

    return NextResponse.json({
      authenticated: true,
      userId: session.userId,
      empId: session.empId,
      userInv: session.userInv,
      imgProfile: session.imgProfile,
      yearAssessment: session.yearAssessment,
      user: { role: role ?? "user" },
    });
  }
}

const sessionRoute = new SessionRoute();

export async function GET(request: NextRequest) {
  return sessionRoute.get(request);
}
