import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const isOpenUrlFormAtom = atom<boolean>(false);

export const tokenAtom = atomWithStorage<string>("APP_TOKEN", "");

export const isDarkModeAtom = atomWithStorage("darkMode", false);

/** The ID of a Route being edited */
export const isEditingRouteIDAtom = atom<string | null>(null);
