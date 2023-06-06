import cls from "classnames";
import { isEmpty } from "lodash-es";
import { PropsWithChildren, useRef } from "react";
import { AriaButtonProps, useButton } from "react-aria";

interface Props extends AriaButtonProps<"button"> {
  xType?: "primary" | "danger";
  className?: string;
}

function BaseButton(props: PropsWithChildren<Props>) {
  const { children, className, xType } = props;

  const ref = useRef<HTMLButtonElement>(null);

  const { buttonProps, isPressed } = useButton(props, ref);

  const _IP = xType === "primary" || !xType;
  const _ID = xType === "danger";

  return (
    <button
      {...buttonProps}
      ref={ref}
      className={cls(
        { [`${className}`]: !isEmpty(className) },
        { "bg-brand": _IP },
        { "bg-red-500": _ID },
        "text-white p-2 rounded flex items-center justify-center"
      )}
    >
      {children}
    </button>
  );
}

export default BaseButton;
