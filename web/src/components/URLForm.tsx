import { InfoIcon, AddIcon } from "@chakra-ui/icons";
import {
  useToast,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftAddon,
  Input,
  FormErrorMessage,
  Button,
  Tooltip,
  Tag,
  TagLabel,
  TagCloseButton,
  CloseButton,
  useClipboard,
} from "@chakra-ui/react";
import { faker } from "@faker-js/faker";
import { useEffect, KeyboardEventHandler } from "react";
import { useFormContext, useFieldArray, useForm } from "react-hook-form";
import BaseButton from "./base/Button";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRoute } from "../api/url";
import { HTTPError } from "ky";
import type { RouteAPI } from "common";

const API_URL = new URL(import.meta.env.VITE_API_URL);

const URL_FORM_SCHEMA = Joi.object({
  path: Joi.string().uri({ relativeOnly: true }).required(),
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

function URLForm({ onClose }: { onClose: () => void }) {
  const toast = useToast();

  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    getValues,
  } = useForm<RouteAPI.POSTBody>({
    resolver: joiResolver(URL_FORM_SCHEMA, { abortEarly: false }),
    defaultValues: {
      path: "",
      targets: [],
      tags: [],
    },
  });

  const qClient = useQueryClient();

  const createRouteMUT = useMutation(createRoute, {
    onSuccess: () => {
      qClient.invalidateQueries(["all-routes"]);
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

  const { append, fields, remove } = useFieldArray<RouteAPI.POSTBody>({
    name: "targets",
    control,
  });

  const path = watch("path");
  const tags = watch("tags");

  const { onCopy, setValue: setValueClipboard } = useClipboard("");

  const WEBHOOK_URL = `${API_URL.toString()}${path}`;

  useEffect(() => {
    setValueClipboard(WEBHOOK_URL);
  }, [path]);

  const onClickCopyWebhookURLButton = () => {
    onCopy();
    toast({ title: "Webhook URL Copied", status: "success", position: "top" });
  };

  const onClickGenerateWebhookPathButton = () => {
    setValue("path", faker.lorem.slug(3));
  };

  const addTarget = () => {
    append({ value: "" });
  };

  const removeTarget = (index: number) => {
    remove(index);
  };

  const onKeyDownTagInput: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && e?.currentTarget?.value?.trim() !== "" && tags) {
      setValue("tags", [...tags, e?.currentTarget?.value]);

      e.currentTarget.value = "";
    }
  };

  const removeTag = (index: number) => {
    setValue(
      "tags",
      tags?.filter((_, tagIndex) => tagIndex !== index)
    );
  };

  function onSubmit(data) {
    console.log("SUBMITTED", data);
    createRouteMUT.mutate(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isInvalid={!!errors?.path} className="mb-4">
        <FormLabel htmlFor="url">Webhook URL</FormLabel>
        <InputGroup>
          <InputLeftAddon className="dark:bg-gray-9">
            {API_URL.toString()}
          </InputLeftAddon>
          <Input id="url" placeholder="URL Path" {...register("path")} />
        </InputGroup>

        <FormErrorMessage>{errors?.path?.message ?? ""}</FormErrorMessage>
      </FormControl>
      <div className="flex justify-center gap-x-2">
        <Button
          colorScheme="blue"
          className="grow max-w-150px"
          onClick={onClickGenerateWebhookPathButton}
        >
          Generate
        </Button>
        <Button
          colorScheme="blue"
          className="grow max-w-150px"
          onClick={onClickCopyWebhookURLButton}
        >
          Copy
        </Button>
      </div>

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
          colorScheme="blue"
        >
          Add Target
        </Button>
      </div>

      <div className="flex gap-x-2 mt-2 flex-row-reverse">
        <BaseButton className="grow" type="submit">
          Save
        </BaseButton>
        <BaseButton className="grow" xType="danger" onPress={onClose}>
          Cancel
        </BaseButton>
      </div>
    </form>
  );
}

export default URLForm;
