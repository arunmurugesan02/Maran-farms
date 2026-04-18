import type { ReactNode } from "react";
import { toast as compatToast } from "@/components/ui/sonner";

type ToastVariant = "default" | "destructive";

type ToastInput = {
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
  id?: string;
};

function toast(input: ToastInput) {
  const id = compatToast(input);
  return {
    id,
    dismiss: () => compatToast.dismiss(id),
    update: (next: ToastInput) => compatToast({ ...next, id })
  };
}

function useToast() {
  return {
    toasts: [],
    toast,
    dismiss: (toastId?: string) => compatToast.dismiss(toastId)
  };
}

export { useToast, toast };
