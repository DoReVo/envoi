import { Event } from "@prisma/client";

export declare namespace Websockets {
  export interface NewRouteEvent {
    type: "new-route-event";
    data: Event;
  }
}

export declare namespace RouteAPI {
  export interface POSTBody {
    path: string;
    targets: Targets[];
    tags?: string[];
  }
}
