import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type ClassValue = string | number | null | false | undefined;

type ClassArray = ClassValue[];

type ClassInput = ClassValue | ClassArray | Record<string, boolean>;

export function cn(...inputs: ClassInput[]) {
  return twMerge(clsx(inputs));
}
