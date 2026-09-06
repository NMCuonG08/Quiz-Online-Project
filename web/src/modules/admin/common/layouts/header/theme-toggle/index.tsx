import { cn } from "@/lib/utils";
import { useTheme } from "@/common/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { Moon, Sun } from "./icons";

const THEMES = [
  {
    name: "light",
    Icon: Sun,
  },
  {
    name: "dark",
    Icon: Moon,
  },
];

export function ThemeToggleSwitch() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="group rounded-full border border-border bg-muted p-[5px] text-foreground shadow-sm outline-1 outline-primary focus-visible:outline"
    >
      <span className="sr-only">
        Switch to {theme === "dark" ? "light" : "dark"} mode
      </span>

      <span aria-hidden className="relative flex gap-2.5">
        {/* Indicator */}
        <span
          className={cn(
            "absolute size-[38px] rounded-full border border-border bg-card shadow-sm transition-transform",
            theme === "dark" ? "translate-x-[48px]" : "translate-x-0"
          )}
        />

        {THEMES.map(({ name, Icon }) => (
          <span
            key={name}
            className={cn(
              "relative grid size-[38px] place-items-center rounded-full",
              name === "dark" && "dark:text-white"
            )}
          >
            <Icon />
          </span>
        ))}
      </span>
    </button>
  );
}
