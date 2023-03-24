import { createContext, useContext } from "react";
import { UseFormReturn } from "react-hook-form";

type ContextType = UseFormReturn<Form.Url.Data>;

const UrlFormContext = createContext<ContextType | null>(null);

export function useUrlFormContext() {
  const context = useContext(UrlFormContext);
  if (!context) {
    throw new Error("Form must be rendered as child of URL Form Modal");
  }
  return context;
}

export default UrlFormContext;
