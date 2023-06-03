import cls from "classnames";
import { PropsWithChildren, useRef } from "react";
import { AriaButtonProps, useButton } from "react-aria";

interface Props extends AriaButtonProps<"button"> {
  xType?: "primary";
}

function BaseButton(props: PropsWithChildren<Props>) {
  const { children } = props;

  const ref = useRef<HTMLButtonElement>(null);

  const { buttonProps, isPressed } = useButton(props, ref);

  return (
    <button
      {...buttonProps}
      ref={ref}
      className="bg-brand text-white p-2 rounded flex items-center justify-center"
    >
      {children}
    </button>
  );
}

export default BaseButton;
