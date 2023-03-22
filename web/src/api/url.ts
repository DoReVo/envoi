import { useKy } from "../hooks/useKy";

const ky = useKy();

export async function createRoute(data: Form.Url.Data) {
  return await ky
    .post("api/route", {
      json: data,
    })
    .json();
}

export async function getAllRoutes() {
  return await ky.get("api/route").json<Form.Url.APIResponse.Data[]>();
}
