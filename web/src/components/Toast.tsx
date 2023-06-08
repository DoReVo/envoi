import { ToastState, useToastQueue } from "@react-stately/toast";
import { createPortal } from "react-dom";
import {
  AriaToastProps,
  AriaToastRegionProps,
  useToast,
  useToastRegion,
} from "@react-aria/toast";
import { useRef } from "react";
import BaseButton from "./base/Button";
import { ToastQueue } from "@react-stately/toast";

interface ToastRegionProps<T> extends AriaToastRegionProps {
  state: ToastState<T>;
}

interface ToastProps<T> extends AriaToastProps<T> {
  state: ToastState<T>;
}

function Toast<T>({ state, ...props }: ToastProps<T>) {
  let ref = useRef(null);
  let { toastProps, titleProps, closeButtonProps } = useToast(
    props,
    state,
    ref
  );

  return (
    <div
      {...toastProps}
      ref={ref}
      className="flex items-center gap-4 bg-brand text-white px-2 rounded py-1"
    >
      <div {...titleProps}>{props?.toast?.content as any}</div>
      <BaseButton {...closeButtonProps}>x</BaseButton>
    </div>
  );
}

function ToastRegion<T>({ state, ...props }: ToastRegionProps<T>) {
  let ref = useRef(null);
  let { regionProps } = useToastRegion(props, state, ref);

  return (
    <div
      {...regionProps}
      ref={ref}
      className="fixed bottom-4 right-4 flex flex-col gap-2"
    >
      {state.visibleToasts.map((toast) => (
        <Toast key={toast.key} toast={toast} state={state} />
      ))}
    </div>
  );
}

export function GlobalToastRegion(props: any) {
  const state = useToastQueue(toastQueue);

  return state.visibleToasts.length > 0
    ? createPortal(<ToastRegion {...props} state={state} />, document.body)
    : null;
}

export const toastQueue = new ToastQueue({ maxVisibleToasts: 10 });
