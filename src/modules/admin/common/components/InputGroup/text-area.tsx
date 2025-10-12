import { cn } from "@/lib/utils";
import { useId } from "react";

interface PropsType {
  label: string;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  icon?: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
}

export function TextAreaGroup({
  label,
  placeholder,
  required,
  disabled,
  active,
  className,
  icon,
  defaultValue,
  value,
  onChange,
  error,
}: PropsType) {
  const id = useId();

  return (
    <div className={cn(className)}>
      <label
        htmlFor={id}
        className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
      >
        {label}
      </label>

      <div className="relative mt-3 [&_svg]:pointer-events-none [&_svg]:absolute [&_svg]:left-5.5 [&_svg]:top-5.5">
        <textarea
          id={id}
          rows={6}
          placeholder={placeholder}
          defaultValue={defaultValue}
          value={value}
          onChange={onChange}
          className={cn(
            "w-full rounded-lg border-[1.5px] bg-transparent px-5.5 py-3 text-dark outline-none transition disabled:cursor-default disabled:bg-gray-2 data-[active=true]:border-primary dark:bg-[#122031] dark:text-white dark:disabled:bg-[#122031] dark:data-[active=true]:border-primary",
            error
              ? "border-destructive focus:border-destructive dark:border-destructive"
              : "border-stroke focus:border-primary dark:border-dark-3 dark:focus:border-primary",
            icon && "py-5 pl-13 pr-5"
          )}
          required={required}
          disabled={disabled}
          data-active={active}
          aria-invalid={!!error}
        />

        {icon}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{String(error)}</p>}
    </div>
  );
}
