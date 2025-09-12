import { cn } from "@/lib/utils"; // hàm merge class như shadcn
import { cva, type VariantProps } from "class-variance-authority";

type UiSpanProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof spanVariants>;

const spanVariants = cva(
  "flex items-center justify-between hover:cursor-pointer rounded-md border px-3 py-2 transition-colors shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-black border-border hover:bg-accent",
        destructive:
          "bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20",
        outline: "bg-white dark:bg-black border-border hover:bg-accent",
        whiteTextBlackBorder:
          "text-foreground border-border bg-white dark:bg-black hover:bg-accent",
      },
      size: {
        sm: "text-sm py-1 px-2",
        md: "text-base py-2 px-3",
        lg: "text-lg py-3 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export function Span({ className, variant, size, ...props }: UiSpanProps) {
  return (
    <span
      className={cn(spanVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { spanVariants };
