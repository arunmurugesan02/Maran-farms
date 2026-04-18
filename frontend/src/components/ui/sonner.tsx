import { Toaster as HotToaster, toast as hotToast, type ToastOptions } from "react-hot-toast";
import type { ComponentProps, ReactNode } from "react";

type ToasterProps = ComponentProps<typeof HotToaster>;
type ToastVariant = "default" | "destructive";

type CompatToastOptions = Omit<ToastOptions, "iconTheme"> & {
  description?: ReactNode;
  variant?: ToastVariant;
};

type CompatToastInput = {
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
  id?: string;
};

function renderToastContent(title?: ReactNode, description?: ReactNode) {
  if (!title && !description) return "";
  if (!title && description) return <>{description}</>;
  if (!description) return <>{title}</>;
  return (
    <div className="space-y-1">
      <p className="text-[13px] sm:text-sm font-semibold leading-tight">{title}</p>
      <p className="text-[12px] sm:text-[13px] text-muted-foreground leading-snug">{description}</p>
    </div>
  );
}

function buildOptions(options?: CompatToastOptions): ToastOptions {
  return {
    id: options?.id,
    duration: options?.duration
  };
}

function compatToast(input: CompatToastInput) {
  const content = renderToastContent(input.title, input.description);
  const options = buildOptions(input);

  if (input.variant === "destructive") {
    return hotToast.error(content, options);
  }

  return hotToast(content, options);
}

const toast = Object.assign(
  (input: CompatToastInput) => compatToast(input),
  {
    success: (title: ReactNode, options?: CompatToastOptions) => {
      const content = renderToastContent(title, options?.description);
      return hotToast.success(content, buildOptions(options));
    },
    error: (title: ReactNode, options?: CompatToastOptions) => {
      const content = renderToastContent(title, options?.description);
      return hotToast.error(content, buildOptions(options));
    },
    dismiss: (toastId?: string) => hotToast.dismiss(toastId)
  }
);

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <HotToaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerClassName="toaster group"
      containerStyle={{ bottom: 16, left: 8, right: 8 }}
      toastOptions={{
        className:
          "rounded-2xl border border-border bg-background text-foreground shadow-lg px-3 py-3 sm:px-4 sm:py-3 w-[calc(100vw-1rem)] sm:w-[380px]",
        duration: 2000,
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          borderColor: "hsl(var(--border))"
        }
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
