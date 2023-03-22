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
  }
}
