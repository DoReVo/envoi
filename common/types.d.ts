import { Event, Route } from "@prisma/client";

type Target = { value: string };

export declare namespace Websockets {
  export interface NewRouteEvent {
    type: "new-route-event";
    routeId: Route["id"];
    data: Event;
  }
}

export declare namespace RouteAPI {
  export type { Route, Event } from "@prisma/client";

  export interface POSTBody {
    path: string;
    targets: Target[];
    tags?: string[];
  }
}
