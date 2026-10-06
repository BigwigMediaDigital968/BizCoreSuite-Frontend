import { isAxiosError } from "axios";

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)
      ?.message ?? fallback;
  }
  return fallback;
};
