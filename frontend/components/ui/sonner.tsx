'use client';

import { CircleCheckIcon, Loader2Icon, OctagonXIcon } from 'lucide-react';
import { Toaster as Sonner, toast, type ToasterProps } from 'sonner';

/* ── variant colour tokens (matching the react-hot-toast reference) ── */
const borders = {
  success: '#B4E330',
  error: '#FF6243',
  loading: '#8B8B8B',
} as const;

const backgrounds = {
  success: '#323628',
  error: '#36282F',
  loading: '#3C3B43',
} as const;

type Variant = keyof typeof borders;

function variantStyle(variant: Variant): React.CSSProperties {
  return {
    border: `1px solid ${borders[variant]}`,
    borderRadius: '0.3rem',
    color: variant === 'loading' ? 'white' : borders[variant],
    backgroundColor: backgrounds[variant],
    padding: '8px 12px',
  };
}

/* ── styled toast helpers (success / error / loading only) ── */

interface ToastMessage {
  title: string
  description: string
}

export const styledToast = {
  success: (msg: ToastMessage) =>
    toast.success(msg.title, {
      description: msg.description,
      style: variantStyle("success"),
      className: "!gap-0.5 !text-sm",
      descriptionClassName: "!text-white !text-xs !mt-0",
    }),

  error: (msg: ToastMessage) =>
    toast.error(msg.title, {
      description: msg.description,
      style: variantStyle("error"),
      className: "!gap-0.5 !text-sm",
      descriptionClassName: "!text-white !text-xs !mt-0",
    }),

  loading: (msg: ToastMessage) =>
    toast.loading(msg.title, {
      description: msg.description,
      style: variantStyle("loading"),
      className: "!gap-0.5 !text-sm",
      descriptionClassName: "!text-white !text-xs !mt-0",
    }),

  /** Dismiss a specific toast (or all if no id given) */
  dismiss: (id?: string | number) => toast.dismiss(id),
};

/* ── Toaster component ── */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-left"
      offset={{ top: 80 }}
      gap={6}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': backgrounds.loading,
          '--normal-text': 'white',
          '--normal-border': borders.loading,
          '--border-radius': '0.3rem',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
