import { Event } from "@prisma/client";

export declare namespace Websockets {
  export interface NewRouteEvent {
    type: "new-route-event";
    data: Event;
  }
}
