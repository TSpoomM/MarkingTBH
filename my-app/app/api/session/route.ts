export async function GET() {
  return Response.json({ user: { name: "Admin TBH", role: "admin" } });
}
