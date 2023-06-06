import React, { useState } from "react";
import type { AriaModalOverlayProps } from "@react-aria/overlays";
import { Overlay, useModalOverlay } from "@react-aria/overlays";
import { OverlayTriggerState } from "react-stately";
import { AriaDialogProps, useDialog } from "react-aria";

interface ModalProps extends AriaModalOverlayProps {
  children: React.ReactNode;
  state: OverlayTriggerState;
}

export function Modal(props: ModalProps) {
  let { children, state } = props;

  let ref = React.useRef(null);
  let { modalProps, underlayProps } = useModalOverlay(props, state, ref);
  let [exited, setExited] = useState(!state.isOpen);

  // Don't render anything if the modal is not open and we're not animating out.
  if (!(state.isOpen || !exited)) {
    return null;
  }

  return (
    <Overlay>
      <div
        className="fixed inset-0 flex justify-center z-100 bg-slate-800/50 items-center"
        {...underlayProps}
      >
        <div
          {...modalProps}
          ref={ref}
          className="p-4 bg-canvas dark:bg-canvas-dark shadow-2xl2 rounded z-1 h-fit relative focus:outline-none"
        >
          {children}
        </div>
      </div>
    </Overlay>
  );
}

interface DialogProps extends AriaDialogProps {
  children: React.ReactNode;
  title: string;
}

export function Dialog(props: DialogProps) {
  let { children } = props;

  let ref = React.useRef(null);
  let { dialogProps, titleProps } = useDialog(
    {
      ...props,
      role: "alertdialog",
    },
    ref
  );

  return (
    <div
      {...dialogProps}
      ref={ref}
      className="outline-none text-left font-mono"
    >
      <h3 {...titleProps} className="text-lg font-bold">
        {props.title}
      </h3>
      {children}
    </div>
  );
}
