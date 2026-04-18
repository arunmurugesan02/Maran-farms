import { Toaster as HotToaster, toast as hotToast, type ToastOptions } from "react-hot-toast";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToasterProps = ComponentProps<typeof HotToaster>;
type ToastVariant = "default" | "destructive";
type ToastImage = { src: string; alt?: string };

type CompatToastOptions = ToastOptions & {
  description?: ReactNode;
  variant?: ToastVariant;
  image?: string | ToastImage;
};

type CompatToastInput = {
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  image?: string | ToastImage;
  duration?: number;
  id?: string;
};

function normalizeImage(image?: string | ToastImage): ToastImage | undefined {
  if (!image) return undefined;
  if (typeof image === "string") {
    const src = image.trim();
    return src ? { src, alt: "Toast image" } : undefined;
  }
  return image.src?.trim() ? { src: image.src.trim(), alt: image.alt || "Toast image" } : undefined;
}

function renderToastContent(title?: ReactNode, description?: ReactNode, image?: string | ToastImage) {
  const media = normalizeImage(image);
  if (!title && !description) return "";
  return (
    <div className="flex items-center gap-2.5 sm:gap-3 w-full">
      {media ? (
        <img
          src={media.src}
          alt={media.alt}
          className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg object-cover border border-border/70 shrink-0"
        />
      ) : null}
      <div className={cn("min-w-0 flex-1", title && description ? "space-y-0.5" : "")}>
        {title ? <p className="text-[14px] sm:text-[16px] font-semibold leading-tight text-foreground">{title}</p> : null}
        {description ? <p className="text-[12.5px] sm:text-[14px] text-muted-foreground leading-snug">{description}</p> : null}
      </div>
    </div>
  );
}

function buildOptions(options?: CompatToastOptions, variant: ToastVariant = "default"): ToastOptions {
  const className = options?.className;
  const style = options?.style;
  const destructive = variant === "destructive";

  return {
    id: options?.id,
    icon: options?.icon,
    duration: options?.duration,
    ariaProps: options?.ariaProps,
    position: options?.position,
    removeDelay: options?.removeDelay,
    toasterId: options?.toasterId,
    iconTheme: options?.iconTheme,
    className: cn(
      "rounded-2xl border bg-background text-foreground shadow-[0_14px_30px_-18px_rgba(0,0,0,0.45)] backdrop-blur px-3.5 py-2.5 sm:px-4 sm:py-3 w-fit max-w-[calc(100vw-2.75rem)] sm:w-[340px]",
      destructive ? "border-destructive/35 bg-destructive/[0.03]" : "border-border/70",
      className
    ),
    style: {
      background: destructive ? "hsl(var(--destructive) / 0.03)" : "hsl(var(--background))",
      color: "hsl(var(--foreground))",
      borderColor: destructive ? "hsl(var(--destructive) / 0.35)" : "hsl(var(--border) / 0.7)",
      ...style
    }
  };
}

function compatToast(input: CompatToastInput) {
  const variant = input.variant ?? "default";
  const content = renderToastContent(input.title, input.description, input.image);
  return hotToast(content, buildOptions(input, variant));
}

const toast = Object.assign(
  (input: CompatToastInput) => compatToast(input),
  {
    success: (title: ReactNode, options?: CompatToastOptions) => {
      const content = renderToastContent(title, options?.description, options?.image);
      return hotToast(content, buildOptions(options, "default"));
    },
    error: (title: ReactNode, options?: CompatToastOptions) => {
      const content = renderToastContent(title, options?.description, options?.image);
      return hotToast(content, buildOptions(options, "destructive"));
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
      containerStyle={{ bottom: 16, left: 4, right: 4 }}
      toastOptions={{
        duration: 2000,
        style: { maxWidth: "min(340px, calc(100vw - 2.75rem))" }
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
