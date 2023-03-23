import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useClipboard,
  CloseButton,
  InputGroup,
  InputLeftAddon,
  InputRightAddon,
  useToast,
  Tag,
  TagLabel,
  TagCloseButton,
  Tooltip,
  Divider,
  IconButton,
  Code,
  Spinner,
} from "@chakra-ui/react";
import Joi from "joi";
import { useAtom } from "jotai";
import {
  useEffect,
  KeyboardEventHandler,
  useState,
  ChangeEventHandler,
} from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { isOpenUrlFormAtom, tokenAtom } from "./atoms";
import {
  AddIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  InfoIcon,
} from "@chakra-ui/icons";
import { DevTool } from "@hookform/devtools";
import { faker } from "@faker-js/faker";
import { isEmpty, isString } from "lodash";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, getAllRoutes } from "./api/url";
import { HTTPError } from "ky";
import { DateTime } from "luxon";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { ReadyState } from "react-use-websocket";
import { getEvents } from "./api/events";

const API_URL = new URL(import.meta.env.VITE_API_URL);
const SOCKET_URL = new URL(import.meta.env.VITE_SOCKET_URL);

const URL_FORM_SCHEMA = Joi.object({
  url: Joi.string().uri({ relativeOnly: true }).required(),
  targets: Joi.array()
    .items(
      Joi.object({
        value: Joi.string().uri().required(),
      })
    )
    .min(1)
    .required(),
  tags: Joi.array().items(Joi.string()),
}).required();

function URLForm() {
  const toast = useToast();
  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    getValues,
  } = useFormContext<Form.Url.Data>();

  const { append, fields, remove } = useFieldArray<Form.Url.Data>({
    name: "targets",
  });

  const url = watch("url");
  const tags = watch("tags");

  const { onCopy, setValue: setValueClipboard } = useClipboard("");

  const WEBHOOK_URL = `${API_URL.toString()}${url}`;

  useEffect(() => {
    setValueClipboard(WEBHOOK_URL);
  }, [url]);

  const onClickCopyWebhookURLButton = () => {
    onCopy();
    toast({ title: "Webhook URL Copied", status: "success", position: "top" });
  };

  const onClickGenerateWebhookPathButton = () => {
    setValue("url", faker.lorem.slug(3));
  };

  const addTarget = () => {
    append({ value: "" });
  };

  const removeTarget = (index: number) => {
    remove(index);
  };

  const onKeyDownTagInput: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && e?.currentTarget?.value?.trim() !== "") {
      setValue("tags", [...tags, e?.currentTarget?.value]);

      e.currentTarget.value = "";
    }
  };

  const removeTag = (index: number) => {
    setValue(
      "tags",
      tags.filter((_, tagIndex) => tagIndex !== index)
    );
  };

  return (
    <form>
      <DevTool control={control} />
      <FormControl isInvalid={!!errors?.url} className="mb-4">
        <FormLabel htmlFor="url">Webhook URL</FormLabel>
        <InputGroup>
          <InputLeftAddon>{API_URL.toString()}</InputLeftAddon>
          <Input id="url" placeholder="URL Path" {...register("url")} />
          <InputRightAddon margin={0} padding={1} borderRadius={0}>
            <Button
              margin={0}
              padding={0}
              color="blue.400"
              onClick={onClickGenerateWebhookPathButton}
            >
              Generate
            </Button>
          </InputRightAddon>
          <InputRightAddon color={"blue"}>
            <Button
              margin={0}
              padding={0}
              color="blue.400"
              onClick={onClickCopyWebhookURLButton}
            >
              Copy
            </Button>
          </InputRightAddon>
        </InputGroup>
        <FormErrorMessage>{errors?.url?.message ?? ""}</FormErrorMessage>
      </FormControl>

      <FormControl className="mb-4">
        <div className="flex items-center justify-start gap-x-2 mb-2">
          <FormLabel htmlFor="tag" margin={0}>
            Tags
          </FormLabel>
          <Tooltip
            hasArrow
            placement="bottom-start"
            label={
              <div>
                Tag with special handling
                <ul>
                  <li>fb</li>
                  <li>line</li>
                  <li>teams</li>
                  <li>slack</li>
                  <li>telegram</li>
                  <li>viber</li>
                  <li>wechat</li>
                  <li>webex</li>
                  <li>instagram</li>
                </ul>
              </div>
            }
          >
            <InfoIcon color="blue.300" />
          </Tooltip>
        </div>

        <Input
          id="tag"
          placeholder="Type and enter tags"
          onKeyDown={onKeyDownTagInput}
        />
      </FormControl>
      <div className="mb-4 flex gap-1 flex-wrap">
        {tags?.map((entry, index) => (
          <Tag colorScheme={"blue"} key={index}>
            <TagLabel>{entry}</TagLabel>
            <TagCloseButton onClick={() => removeTag(index)} />
          </Tag>
        ))}
      </div>

      <div className="font-bold">Webhook Forward Targets</div>
      <FormControl isInvalid={!!errors?.targets?.message} className="mb-4">
        <FormErrorMessage>{errors?.targets?.message}</FormErrorMessage>
      </FormControl>

      {fields.map((field, index) => (
        <FormControl
          key={`FormControl-${field.id}`}
          isInvalid={!!errors?.targets?.[index]}
          className="mb-4"
        >
          <div className="flex items-center">
            <Input
              id={`Target-${field.id}`}
              placeholder={`Webhook Forward Target ${index + 1}`}
              {...register(`targets.${index}.value`)}
            />
            <CloseButton color="red" onClick={() => removeTarget(index)} />
          </div>

          <FormErrorMessage>
            {errors?.targets?.[index]?.value?.message ?? ""}
          </FormErrorMessage>
        </FormControl>
      ))}
      <FormControl></FormControl>

      <div className="mt-4 flex justify-start">
        <Button
          size="sm"
          leftIcon={<AddIcon />}
          onClick={addTarget}
          color="blue"
        >
          Add Target
        </Button>
      </div>
    </form>
  );
}

function UrlFormModal() {
  const [isOpenUrlForm, setIsOpenUrlFormModal] = useAtom(isOpenUrlFormAtom);

  const toast = useToast();

  const useFormReturn = useForm<Form.Url.Data>({
    resolver: joiResolver(URL_FORM_SCHEMA, { abortEarly: false }),
    defaultValues: {
      url: "",
      targets: [],
      tags: [],
    },
  });

  const onClose = () => {
    useFormReturn.reset();
    setIsOpenUrlFormModal(false);
  };

  const createRouteMUT = useMutation(createRoute, {
    onSuccess: () => {
      onClose();
      toast({ title: "Webhook created", status: "success", position: "top" });
    },
    onError: async (res) => {
      if (res instanceof HTTPError) {
        try {
          const err = await res?.response?.json();
          if (err?.error?.message)
            toast({
              title: err?.error?.message,
              status: "error",
              position: "top",
            });
          else throw new Error("Unkown error");
        } catch (error) {
          toast({
            title: "Unexpected Error",
            status: "error",
            position: "top",
          });
        }
      }
    },
  });

  function onSubmitHandler(data: Form.Url.Data) {
    console.log("Submitted", data);
    createRouteMUT.mutate(data);
  }

  const onSaveClick = () => {
    useFormReturn.handleSubmit(onSubmitHandler)();
  };

  return (
    <FormProvider {...useFormReturn}>
      <Modal
        isOpen={isOpenUrlForm}
        onClose={onClose}
        closeOnOverlayClick={false}
        size="3xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New URL</ModalHeader>

          <ModalBody>
            <URLForm />
          </ModalBody>

          <ModalFooter gap="2">
            <Button color="red" onClick={onClose}>
              Cancel
            </Button>
            <Button color="blue" onClick={onSaveClick}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FormProvider>
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

  return (
    <div className="p-8 mx-auto">
      <h1 className="text-center text-3xl font-bold">
        Envoi Webhook Demultiplexer
      </h1>
      <div className="max-w-lg mx-auto">
        <div className=" flex gap-x-4 mt-8">
          <div className="font-bold">Status</div>
          <Tag colorScheme={"green"}>{connectionStatus}</Tag>
        </div>
        <div className=" flex gap-x-4 mt-4">
          <div className="flex justify-center items-center font-bold">
            Token
          </div>
          <Input value={token} onChange={onChangeTokenInput} />
        </div>
        <div className=" flex mt-4">
          <Button colorScheme="blue" onClick={onClickAddUrl}>
            Add URL
          </Button>
        </div>
      </div>

      <WebhookRoutes />

      <UrlFormModal />
    </div>
  );
}

export default App;
