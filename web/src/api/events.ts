import { RouteAPI } from "common";
import { createKy } from "../hooks/createKy";

const ky = createKy();

export async function getEvents(query: any) {
  const { queryKey } = query;

  const [_, id] = queryKey;

  return await ky.get(`api/route/${id}/event`).json<RouteAPI.Event[]>();
}
