"use client";

import { useTheme } from "next-themes";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ position, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  // On phones the bottom of the screen holds the code keys and the on-screen
  // keyboard: show notifications at the top, below the toolbar and tabs.
  const phone = useMediaQuery("(max-width: 639px)") === true;

  return (
    <Sonner
      position={phone ? "top-center" : position}
      mobileOffset={{ top: 104 }}
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
