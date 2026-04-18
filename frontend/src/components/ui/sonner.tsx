import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      visibleToasts={1}
      closeButton
      duration={2000}
      offset={16}
      mobileOffset={{ bottom: "max(12px, env(safe-area-inset-bottom))", left: 8, right: 8 }}
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-2xl border border-border bg-background text-foreground shadow-lg px-3 py-3 sm:px-4 sm:py-3 group-[.toaster]:w-[calc(100vw-1rem)] sm:group-[.toaster]:w-[380px]",
          title: "text-[13px] sm:text-sm font-semibold leading-tight",
          description: "text-[12px] sm:text-[13px] text-muted-foreground leading-snug",
          actionButton: "bg-primary text-primary-foreground h-8 px-3 rounded-md text-xs sm:text-sm",
          cancelButton: "bg-muted text-muted-foreground h-8 px-3 rounded-md text-xs sm:text-sm",
          closeButton: "bg-background border border-border text-muted-foreground hover:text-foreground"
        }
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
