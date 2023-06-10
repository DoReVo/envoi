import { useAtom } from "jotai";
import { useState, ChangeEventHandler } from "react";
import {
  isDarkModeAtom,
  isEditingRouteIDAtom,
  isOpenUrlFormAtom,
  tokenAtom,
} from "./atoms";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllRoutes } from "./api/url";
import { DateTime } from "luxon";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { ReadyState } from "react-use-websocket";
import { getEvents } from "./api/events";
import cls from "classnames";
import BaseButton from "./components/base/Button";
import TextInput from "./components/base/TextInput";
import { Dialog, Modal } from "./components/base/Modal";
import { useOverlayTriggerState } from "react-stately";
import URLForm from "./components/URLForm";
import { RouteAPI, Target, Websockets } from "common";
import { toastQueue as toast } from "./components/Toast";

const SOCKET_URL = new URL(import.meta.env.VITE_SOCKET_URL);

function UrlFormModal() {
  const [isOpenUrlForm, setIsOpenUrlFormModal] = useAtom(isOpenUrlFormAtom);
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);

  const onClose = () => {
    setIsOpenUrlFormModal(false);
  };

  const state = useOverlayTriggerState({ isOpen: isOpenUrlForm });

  return (
    <Modal state={state}>
      <Dialog title="Add New URL">
        <URLForm onClose={onClose} />
      </Dialog>
    </Modal>
  );
}

function WebhookEventCard(props: { event: RouteAPI.Event }) {
  const { event } = props;
  const [expanded, setExpanded] = useState(false);

  const onCardClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="bg-slate-100 p-2">
      <div className="flex justify-between items-center gap-x-2">
        <div className="px-2 py-1 text-center w-max rounded text-sm text-white bg-cyan-600">
          {event?.method}
        </div>

        <div className="grow text-sm">{event?.id}</div>

        <div>{DateTime.fromISO(event?.timestamp as any).toRelative()}</div>

        <BaseButton onPress={onCardClick}>
          {expanded ? (
            <div className="i-carbon-arrow-up" />
          ) : (
            <div className="i-carbon-arrow-down" />
          )}
        </BaseButton>
      </div>

      {expanded ? (
        <>
          <div className="font-bold mt-4 mb-2">Request Headers</div>
          <div className="whitespace-pre">
            {JSON.stringify(event?.header, null, 1)}
          </div>
          <div className="font-bold mt-4 mb-2">Request Query String</div>
          <div className="whitespace-pre">
            {JSON.stringify(event?.queryString, null, 1)}
          </div>
          <div className="font-bold mt-4 mb-2">Request Body</div>
          <div className="whitespace-pre">
            {JSON.stringify(event?.body, null, 1)}
          </div>
        </>
      ) : null}
    </div>
  );
}

function RouteCard(props: { route: RouteAPI.Route }) {
  const [, setIsEditingID] = useAtom(isEditingRouteIDAtom);
  const [, setIsOpenUrlForm] = useAtom(isOpenUrlFormAtom);
  const { route } = props;

  const [expanded, setExpanded] = useState(false);

  const onClickExpandBtn = () => {
    setExpanded(!expanded);
  };

  const onClickEditBtn = () => {
    setIsEditingID(route?.id);
    setIsOpenUrlForm(true);
  };

  // Get events

  const { data, isLoading } = useQuery(["event-stream", route.id], getEvents, {
    staleTime: 1000 * 60 * 1,
  });

  return (
    <div className="p-2">
      <div className="flex justify-between items-center">
        <div className="text-lg rounded bg-blue-500 px-2 text-white">
          {route?.path}
        </div>
        <div className="flex gap-x-2">
          <BaseButton onPress={onClickEditBtn}>Edit</BaseButton>
          <BaseButton onPress={onClickExpandBtn}>
            {expanded ? (
              <div className="i-carbon-arrow-up" />
            ) : (
              <div className="i-carbon-arrow-down" />
            )}
          </BaseButton>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4">
          <div className="font-bold mb-2 text-lg">Forward Targets</div>
          <div className="flex flex-col gap-y-2">
            {(route["targets"] as Target[])?.map((entry) => (
              <div
                key={entry?.value}
                className="rounded bg-teal-500 px-2 text-white w-max"
              >
                {entry.value}
              </div>
            ))}
          </div>

          <div className="font-bold mt-4 text-lg">Events</div>
          {isLoading ? (
            <div className="flex justify-center items-center">...Loading</div>
          ) : (
            <div>
              {data?.map((entry) => (
                <WebhookEventCard key={entry?.id} event={entry} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function WebhookRoutes() {
  const { data, isLoading } = useQuery(["all-routes"], getAllRoutes);

  return (
    <div className="mt-8 max-w-4xl mx-auto">
      <h1 className="text-left text-xl font-bold">Webhook Routes</h1>

      <div className="flex flex-col gap-y-2 divide-y divide-slate-400">
        {data?.map?.((entry) => (
          <RouteCard key={entry?.id} route={entry} />
        ))}
      </div>
    </div>
  );
}

function App() {
  const [isOpenUrlForm, setIsOpenUrlFormModal] = useAtom(isOpenUrlFormAtom);

  const qClient = useQueryClient();

  const [token, setToken] = useAtom(tokenAtom);
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);

  const { readyState } = useWebSocket(
    `${SOCKET_URL.toString()}?token=${token}`,
    {
      onMessage(event) {
        const eventData = JSON.parse(event?.data) as Websockets.NewRouteEvent;

        if (eventData?.type === "new-route-event") {
          const key = ["event-stream", eventData?.routeId];

          qClient.setQueryData(key, (oldData: any) => {
            console.log("Updating...", oldData);
            return [eventData?.data, ...oldData];
          });

          toast.add("New webhook event", { timeout: 3000 });
        }
      },
    }
  );

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Connected",
    [ReadyState.CLOSING]: "Disconnecting",
    [ReadyState.CLOSED]: "Disconnected",
    [ReadyState.UNINSTANTIATED]: "Disconnected",
  }[readyState];

  const onClickAddUrl = () => {
    setIsOpenUrlFormModal(true);
  };

  const onChangeTokenInput: ChangeEventHandler<HTMLInputElement> = (e) => {
    setToken(e?.currentTarget?.value);
  };

  const onClickDarkMode = () => {
    setIsDarkMode((state) => !state);
  };

  return (
    <div className={cls({ dark: isDarkMode }, "font-mono")}>
      <div className="dark:bg-gray-9 min-h-screen p-8 mx-auto w-full dark:text-white">
        <div className="flex flex-col justify-center items-center">
          <h1 className="text-center text-3xl font-bold ">
            Envoi Webhook Demultiplexer
          </h1>
          <BaseButton onPress={onClickDarkMode}>
            {isDarkMode ? (
              <div className="i-carbon-moon" />
            ) : (
              <div className="i-carbon-light" />
            )}
          </BaseButton>
        </div>
        <div className="max-w-lg mx-auto">
          <div className=" flex gap-x-4 mt-8">
            <div className="font-bold">Status</div>
            <span className="bg-green-200 p-1 rounded text-sm">
              {connectionStatus}
            </span>
          </div>
          <div className=" flex gap-x-4 mt-4">
            <div className="flex justify-center items-center font-bold">
              Token
            </div>
            <TextInput value={token} onChange={onChangeTokenInput} />
          </div>
          <div className=" flex mt-4">
            <BaseButton onPress={onClickAddUrl}>
              <span>Add URL</span>
              <span className="inline-block i-carbon-add"></span>
            </BaseButton>
          </div>
        </div>

        <WebhookRoutes />

        <UrlFormModal />
      </div>
    </div>
  );
}

export default App;
