import { Event } from "@prisma/client";

type Target = { value: string };

export declare namespace Websockets {
  export interface NewRouteEvent {
    type: "new-route-event";
    data: Event;
  }
}

export declare namespace RouteAPI {
  export type { Route } from "@prisma/client";
  export interface POSTBody {
    path: string;
    targets: Target[];
    tags?: string[];
  }
}
