import { faker } from "@faker-js/faker";
import { KeyboardEventHandler, PropsWithChildren } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import BaseButton from "./base/Button";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoute, editRoute, getSingleRoute } from "../api/url";
import { HTTPError } from "ky";
import type { RouteAPI } from "common";
import TextInput from "./base/TextInput";
import { usePress } from "react-aria";
import { toastQueue as toast } from "./Toast";
import { useCopyToClipboard } from "react-use";
import { isEditingRouteIDAtom } from "../atoms";
import { useAtom } from "jotai";
import { DevTool } from "@hookform/devtools";
import { isArray } from "lodash-es";

const API_URL = new URL(import.meta.env.VITE_API_URL);

const URL_FORM_SCHEMA = Joi.object({
  path: Joi.string().required(),
  targets: Joi.array()
    .items(
      Joi.object({
        value: Joi.string().uri().required(),
      })
    )
    .min(1)
    .required(),
  tags: Joi.array().items(Joi.string()).empty(null),
}).required();

function FormTag(props: PropsWithChildren<{ pressCB: () => void }>) {
  const { pressProps } = usePress({ onPress: props.pressCB });

  return (
    <div className="text-white bg-blue-400 p-1 rounded text-sm" {...pressProps}>
      {props.children}
    </div>
  );
}

function URLForm({ onClose }: { onClose: () => void }) {
  const [isEditingID, setIsEditingID] = useAtom(isEditingRouteIDAtom);

  const { data: routeData, isLoading: isLoadingRouteData } = useQuery(
    ["route", isEditingID],
    async () => isEditingID !== null && (await getSingleRoute(isEditingID)),
    {
      enabled: !!isEditingID,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    getValues,
  } = useForm<RouteAPI.POSTBody>({
    resolver: joiResolver(URL_FORM_SCHEMA, {
      abortEarly: false,
      stripUnknown: true,
    }),
    values: routeData as any,
  });

  const qClient = useQueryClient();

  const createRouteMUT = useMutation(createRoute, {
    onSuccess: () => {
      qClient.invalidateQueries(["all-routes"]);
      closeForm();
      toast.add("Webhook created", {
        timeout: 2000,
      });
    },
    onError: async (res) => {
      if (res instanceof HTTPError) {
        try {
          const err = await res?.response?.json();
          if (err?.error?.message) toast.add(err?.error?.message);
          else throw new Error("Unkown error");
        } catch (error) {
          toast.add("Unexpected Error");
        }
      }
    },
  });

  const editRouteMUT = useMutation(
    async (data: RouteAPI.POSTBody) =>
      isEditingID && (await editRoute(isEditingID, data)),
    {
      onSuccess: () => {
        qClient.invalidateQueries(["all-routes"]);
        qClient.invalidateQueries(["route", isEditingID]);
        closeForm();
        toast.add("Webhook edited", { timeout: 2000 });
      },
      onError: async (res) => {
        if (res instanceof HTTPError) {
          try {
            const err = await res?.response?.json();
            if (err?.error?.message) toast.add(err?.error?.message);
            else throw new Error("Unkown error");
          } catch (error) {
            toast.add("Unexpected Error");
          }
        }
      },
    }
  );

  const { append, fields, remove } = useFieldArray<RouteAPI.POSTBody>({
    name: "targets",
    control,
  });

  const path = watch("path");
  const tags = watch("tags");

  const [_, copyToClipboard] = useCopyToClipboard();

  const WEBHOOK_URL = `${API_URL.toString()}${path}`;

  const onClickCopyWebhookURLButton = () => {
    copyToClipboard(WEBHOOK_URL);
    toast.add("Webhook URL Copied");
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
    if (e.key === "Enter" && e?.currentTarget?.value?.trim() !== "") {
      if (!isArray(tags)) setValue("tags", [e?.currentTarget?.value]);
      else setValue("tags", [...tags, e?.currentTarget?.value]);

      e.preventDefault();
      e.currentTarget.value = "";
    }
  };

  const removeTag = (index: number) => {
    setValue(
      "tags",
      tags?.filter((_, tagIndex) => tagIndex !== index)
    );
  };

  function onSubmit(data: any) {
    if (!isEditingID) createRouteMUT.mutate(data);
    else editRouteMUT.mutate(data);
  }

  function closeForm() {
    setIsEditingID(null);
    onClose();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="">
      <DevTool control={control} />
      <label>Webhook URL</label>
      <TextInput {...register("path")} />
      <span className="text-red-400">{errors?.path?.message}</span>
      <div className="flex justify-center gap-x-2 mt-2">
        <BaseButton onPress={onClickGenerateWebhookPathButton}>
          Generate
        </BaseButton>
        <BaseButton onPress={onClickCopyWebhookURLButton}>Copy</BaseButton>
      </div>
      <label>Tags</label>
      <TextInput
        id="tag"
        placeholder="Type and enter tags"
        onKeyDown={onKeyDownTagInput}
      />
      <div className="mb-4 mt-2 flex gap-1 flex-wrap">
        {tags?.map((entry, index) => (
          <FormTag pressCB={() => removeTag(index)}>{entry}</FormTag>
        ))}
      </div>
      <div className="font-bold">Webhook Forward Targets</div>
      <span className="text-red-400">{errors?.targets?.message}</span>
      {fields.map((field, index) => (
        <div className="flex flex-col gap-y-2">
          <div className="flex gap-x-2">
            <TextInput
              id={`Target-${field.id}`}
              placeholder={`Webhook Forward Target ${index + 1}`}
              {...register(`targets.${index}.value`)}
            />
            <BaseButton onPress={() => removeTarget(index)}>
              <div className="i-carbon-close"></div>
            </BaseButton>
          </div>

          <span className="text-red-400">
            {errors?.targets?.[index]?.value?.message ?? ""}
          </span>
        </div>
      ))}

      <div className="mt-4 flex justify-start">
        <BaseButton onPress={addTarget}>Add Target</BaseButton>
      </div>

      <div className="flex gap-x-2 mt-2 flex-row-reverse">
        <BaseButton className="grow" type="submit">
          Save
        </BaseButton>
        <BaseButton className="grow" xType="danger" onPress={closeForm}>
          Cancel
        </BaseButton>
      </div>
    </form>
  );
}

export default URLForm;
