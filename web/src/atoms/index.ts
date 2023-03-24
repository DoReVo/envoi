import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const isOpenUrlFormAtom = atom<boolean>(false);

export const tokenAtom = atomWithStorage<string>("APP_TOKEN", "");
