declare namespace Form {
  declare module Url {
    interface Data {
      url: string;
      targets: Target[];
      tags: string[];
    }

    interface Target {
      value: string;
    }

    declare module APIResponse {
      interface Data extends Url.Data {
        created: string;
      }

      interface RouteEvents {
        streamId: string;
        data: EventData;
      }
    }
  }
}

interface EventData {
  timestamp: number;
  reqId: string;
  method: string;
  headers: Headers;
  body: Body;
  queryString: QueryString;
}

declare namespace SocketEvent {
  interface WebhookEvent {
    type: string;
    streamId: string;
    path: string;
    data: SocketEvent.WebhookData;
  }

  interface WebhookData {
    reqId: string;
    timestamp: number;
    method: string;
    headers: Headers;
    body: Body;
    queryString: QueryString;
  }
}

interface QueryString {
  [x: string]: string;
}

interface Body {
  [x: string]: string;
}

interface Headers {
  [x: string]: string;
}
