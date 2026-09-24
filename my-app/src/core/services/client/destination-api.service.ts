import { httpService, HttpService } from "./http.service";
import type { DestinationItem } from "@/src/core/models/destination";

export class DestinationApiService {
  constructor(private readonly http: HttpService) {}

  list(): Promise<DestinationItem[]> {
    return this.http.data<DestinationItem[]>("/api/destinations?manage=1");
  }

  create(value: string) {
    return this.http.postJson<DestinationItem>("/api/destinations", { value });
  }

  update(id: string, value: string) {
    return this.http.putJson<DestinationItem>("/api/destinations", { id, value });
  }

  remove(id: string) {
    return this.http.deleteJson("/api/destinations", { id });
  }
}

export const destinationApiService = new DestinationApiService(httpService);
