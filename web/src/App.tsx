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
import { AddIcon, InfoIcon } from "@chakra-ui/icons";
import { DevTool } from "@hookform/devtools";
import { faker } from "@faker-js/faker";
import { isEmpty, isString } from "lodash";

const API_URL = new URL(import.meta.env.VITE_API_URL);

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

  function onSubmitHandler(data: Form.Url.Data) {
    console.log("Submitted", data);
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

function App() {
  const [isOpenUrlForm, setIsOpenUrlFormModal] = useAtom(isOpenUrlFormAtom);

  const toast = useToast();

  const [token, setToken] = useAtom(tokenAtom);

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
      <div className="max-w-lg mx-auto flex gap-x-4 mt-8">
        <div className="flex justify-center items-center font-bold">Token</div>
        <Input value={token} onChange={onChangeTokenInput} />
      </div>
      <div className="max-w-lg mx-auto flex mt-4">
        <Button colorScheme="blue" onClick={onClickAddUrl}>
          Add URL
        </Button>
      </div>

      <UrlFormModal />
    </div>
  );
}

export default App;
