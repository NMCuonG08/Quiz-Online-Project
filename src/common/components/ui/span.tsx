import { cn } from "@/lib/utils"; // hàm merge class như shadcn
import { cva, type VariantProps } from "class-variance-authority";

type UiSpanProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof spanVariants>;

const spanVariants = cva(
  "flex items-center justify-between rounded-md border px-3 py-2 transition-colors shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-white border-1 border-gray-400 hover:bg-gray-100",
        destructive: "bg-red-100 border-red-300 text-red-700 hover:bg-red-200",
        outline: "bg-transparent border-gray-300 hover:bg-gray-50",
        whiteTextBlackBorder: "text-white border-black bg-transparent hover:bg-black/10",
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
