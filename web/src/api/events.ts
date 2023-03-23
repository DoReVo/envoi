import { useKy } from "../hooks/useKy";

const ky = useKy();

export async function getEvents(query: any) {
  const { queryKey } = query;

  const [_, path] = queryKey;

  console.log("Path given", path);

  return await ky
    .get("api/route/events", {
      searchParams: { path },
    })
    .json<Form.Url.APIResponse.RouteEvents[]>();
}
