import { NextRequest, NextResponse } from "next/server";
import { getDevAuthSession, isDevAuthBypassEnabled } from "@/app/lib/devAuth";
import { getHrkpisSessionCookieName, readHrkpisSession } from "@/app/lib/hrkpisSession";

export async function GET(request: NextRequest) {
  if (isDevAuthBypassEnabled) {
    return NextResponse.json({
      authenticated: true,
      ...getDevAuthSession(),
    });
  }

  const sessionId = request.cookies.get(getHrkpisSessionCookieName())?.value;
  const session = await readHrkpisSession(sessionId);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    userId: session.userId,
    empId: session.empId,
    userInv: session.userInv,
    imgProfile: session.imgProfile,
    yearAssessment: session.yearAssessment,
  });
}
