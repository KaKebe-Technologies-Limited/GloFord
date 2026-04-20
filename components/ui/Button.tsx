import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[--radius-md] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[--color-primary] text-[--color-primary-fg] hover:opacity-90",
        secondary: "bg-[--color-secondary] text-[--color-secondary-fg] hover:opacity-90",
        outline: "border border-[--color-border] bg-transparent hover:bg-[--color-muted]",
        ghost: "bg-transparent hover:bg-[--color-muted]",
        danger: "bg-[--color-danger] text-[--color-danger-fg] hover:opacity-90",
        link: "text-[--color-primary] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
