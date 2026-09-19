import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border-0 text-sm font-bold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ink/15",
  {
    variants: {
      variant: {
        primary: "bg-ink text-paper hover:bg-ink/90 hover:-translate-y-px",
        ghost: "bg-transparent text-ink border border-line hover:border-ink",
        amber: "bg-excess text-ink hover:bg-excess/90",
      },
      size: {
        default: "px-[18px] py-3",
        lg: "h-[47px] px-[18px]",
        full: "h-[47px] w-full px-[18px]",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
