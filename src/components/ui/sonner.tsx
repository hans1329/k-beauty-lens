import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:text-white group-[.toaster]:border-white/20 group-[.toaster]:shadow-lg backdrop-blur-xl",
          title: "group-[.toast]:font-bold group-[.toast]:text-white",
          description: "group-[.toast]:text-white/90",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
        style: {
          background: 'linear-gradient(135deg, hsl(180 70% 40% / 0.85), hsl(220 70% 50% / 0.85), hsl(280 65% 55% / 0.85))',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
