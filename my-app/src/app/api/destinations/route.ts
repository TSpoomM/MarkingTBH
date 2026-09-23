import { destinationRepository } from "@/src/core/repositories/destination.repository";

export const runtime = "nodejs";

class DestinationsRoute {
  async get() {
    try {
      return Response.json({ data: await destinationRepository.findOptions() });
    } catch (error) {
      console.error("GET /api/destinations", error);
      const message = error instanceof Error ? error.message : "โหลด destination ไม่สำเร็จ";
      return Response.json({ message }, { status: 500 });
    }
  }
}

const destinationsRoute = new DestinationsRoute();

export async function GET() {
  return destinationsRoute.get();
}
