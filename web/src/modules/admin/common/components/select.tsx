"use client";

import { ChevronUpIcon } from "@/modules/admin/common/components/icons";
import { cn } from "@/lib/utils";
import { useId, useState } from "react";

type PropsType = {
  label: string;
  items: { value: string; label: string }[];
  prefixIcon?: React.ReactNode;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
} & (
  | { placeholder?: string; defaultValue: string }
  | { placeholder: string; defaultValue?: string }
);

export function Select({
  items,
  label,
  defaultValue,
  placeholder,
  prefixIcon,
  className,
  value,
  onChange,
  error,
}: PropsType) {
  const id = useId();

  const [isOptionSelected, setIsOptionSelected] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsOptionSelected(true);
    onChange?.(e);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label
        htmlFor={id}
        className="block text-body-sm font-medium text-dark dark:text-white"
      >
        {label}
      </label>

      <div className="relative">
        {prefixIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {prefixIcon}
          </div>
        )}

        <select
          id={id}
          value={value !== undefined ? value : defaultValue || ""}
          onChange={handleChange}
          className={cn(
            "w-full appearance-none rounded-lg border bg-transparent px-5.5 py-3 outline-none transition active:border-primary [&>option]:text-dark-5 dark:[&>option]:text-dark-6 dark:bg-[#122031]",
            error
              ? "border-destructive focus:border-destructive dark:border-destructive"
              : "border-stroke focus:border-primary dark:border-dark-3 dark:focus:border-primary",
            isOptionSelected && "text-dark dark:text-white",
            prefixIcon && "pl-11.5"
          )}
          aria-invalid={!!error}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}

          {items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <ChevronUpIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-180" />
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{String(error)}</p>}
    </div>
  );
}
