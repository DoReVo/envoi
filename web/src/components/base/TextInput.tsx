import cls from "classnames";
import { isEmpty } from "lodash";
import { ForwardedRef, forwardRef, HTMLProps } from "react";

interface Props extends HTMLProps<HTMLInputElement> {
  xType?: "text" | "textarea";
  className?: string;
  rootClassName?: string;
  [x: string]: any;
}

type ComponentSignature = (
  props: Props,
  ref: ForwardedRef<HTMLInputElement>
) => ReturnType<typeof TextInput>;

function TextInput(props: Props, ref: ForwardedRef<HTMLInputElement>) {
  const { xType = "text", className, ...restOfProps } = props;

  return (
    <input
      ref={ref}
      {...restOfProps}
      className={cls(
        { [`${className}`]: !isEmpty(className) },
        "w-full rounded px-2 py-1 dark:text-white bg-inherit",
        "border"
      )}
      type={xType}
    />
  );
}

export default forwardRef<HTMLInputElement, Props>(
  TextInput
) as ComponentSignature;
