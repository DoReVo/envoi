import { useToast, Divider, IconButton, Code, Spinner } from "@chakra-ui/react";
import Joi from "joi";
import { useAtom } from "jotai";
import { useState, ChangeEventHandler } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { isDarkModeAtom, isOpenUrlFormAtom, tokenAtom } from "./atoms";
import { ArrowDownIcon, ArrowUpIcon } from "@chakra-ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, getAllRoutes } from "./api/url";
import { HTTPError } from "ky";
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

function WebhookEventCard(props: { event: Form.Url.APIResponse.RouteEvents }) {
  const { event } = props;
  const [expanded, setExpanded] = useState(false);

  const onCardClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="bg-slate-100 p-2">
      <div className="flex justify-between items-center gap-x-2">
        <div className="px-2 py-1 text-center w-max rounded text-sm text-white bg-cyan-600">
          {event?.data?.method}
        </div>

        <div className="grow text-sm">{event?.data?.reqId}</div>

        <div>
          {DateTime.fromMillis(event?.data?.timestamp).toRelative(
            DateTime.now()
          )}
        </div>

        <IconButton
          aria-label="Expand"
          icon={expanded ? <ArrowUpIcon /> : <ArrowDownIcon />}
          colorScheme="green"
          rounded="full"
          onClick={onCardClick}
          size="sm"
        />
      </div>

      {expanded ? (
        <>
          <div className="font-bold mt-4 mb-2">Request Headers</div>
          <Code className="whitespace-pre" bg={"gray.100"}>
            {JSON.stringify(event?.data?.headers, null, 1)}
          </Code>
          <div className="font-bold mt-4 mb-2">Request Query String</div>
          <Code className="whitespace-pre" bg={"gray.100"}>
            {JSON.stringify(event?.data?.queryString, null, 1)}
          </Code>
          <div className="font-bold mt-4 mb-2">Request Body</div>
          <Code className="whitespace-pre" bg={"gray.100"}>
            {JSON.stringify(event?.data?.body, null, 1)}
          </Code>
        </>
      ) : null}
    </div>
  );
}

function RouteCard(props: { route: Form.Url.APIResponse.Data }) {
  const { route } = props;

  const [expanded, setExpanded] = useState(false);

  const onClickExpandBtn = () => {
    setExpanded(!expanded);
  };

  // Get events

  const { data, isLoading } = useQuery(["event-stream", route.url], getEvents, {
    staleTime: 1000 * 60 * 1,
  });

  return (
    <div className="p-2">
      <div className="flex justify-between items-center">
        <div className="text-lg rounded bg-blue-500 px-2 text-white">
          {route.url}
        </div>
        <IconButton
          aria-label="Expand"
          icon={expanded ? <ArrowUpIcon /> : <ArrowDownIcon />}
          colorScheme="blue"
          rounded="full"
          onClick={onClickExpandBtn}
          size="sm"
        />
      </div>

      {expanded ? (
        <div className="mt-4">
          <div className="font-bold mb-2 text-lg">Forward Targets</div>
          <div className="flex flex-col gap-y-2">
            {route.targets.map((entry) => (
              <div className="rounded bg-teal-500 px-2 text-white w-max">
                {entry.value}
              </div>
            ))}
          </div>

          <div className="font-bold mt-4 text-lg">Events</div>
          {isLoading ? (
            <div className="flex justify-center items-center">
              <Spinner color="blue" />
            </div>
          ) : (
            <div>
              {data?.map((entry) => (
                <WebhookEventCard key={entry?.data?.reqId} event={entry} />
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
      <Divider />

      <div className="flex flex-col gap-y-2 divide-y divide-slate-400">
        {data?.map?.((entry) => (
          <RouteCard key={`${entry.url}-${entry.created}`} route={entry} />
        ))}
      </div>
    </div>
  );
}

function App() {
  const [isOpenUrlForm, setIsOpenUrlFormModal] = useAtom(isOpenUrlFormAtom);

  const toast = useToast();
  const qClient = useQueryClient();

  const [token, setToken] = useAtom(tokenAtom);
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);

  const { readyState } = useWebSocket(
    `${SOCKET_URL.toString()}?token=${token}`,
    {
      onMessage(event) {
        const eventData = JSON.parse(event?.data) as SocketEvent.WebhookEvent;

        if (eventData?.type === "new-request") {
          const key = ["event-stream", eventData?.path];

          qClient.setQueryData(key, (oldData: any) => {
            console.log("Updating...", oldData);
            return [eventData, ...oldData];
          });

          toast({
            id: eventData?.streamId,
            title: "New webhook event",
            description: `Path: ${eventData?.path}`,
            position: "bottom-left",
            duration: 1000,
          });
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
