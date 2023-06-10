import { RouteAPI } from "common";
import { createKy } from "../hooks/createKy";

const ky = createKy();

export async function createRoute(data: RouteAPI.POSTBody) {
  return await ky
    .post("api/route", {
      json: data,
    })
    .json();
}

export async function editRoute(id: string, data: RouteAPI.POSTBody) {
  return await ky
    .patch(`api/route/${id}`, {
      json: data,
    })
    .json();
}

export async function deleteRoute(id: string) {
  return await ky.delete(`api/route/${id}`).json();
}

export async function getSingleRoute(id: string) {
  return await ky.get(`api/route/${id}`).json<RouteAPI.Route>();
}

export async function getAllRoutes() {
  return await ky.get("api/route").json<RouteAPI.Route[]>();
}
