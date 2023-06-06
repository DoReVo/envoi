import ky from "ky";
import { isEmpty, isNull } from "lodash";

export function createKy() {
  return ky.create({
    prefixUrl: import.meta.env.VITE_API_URL,
    hooks: {
      beforeRequest: [
        (req) => {
          const token = localStorage.getItem("APP_TOKEN");

          if (!isEmpty(token) && !isNull(token))
            req.headers.set("Authorization", JSON.parse(token));
        },
      ],
    },
  });
}
