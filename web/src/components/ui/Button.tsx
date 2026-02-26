import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "ghost" | "destructive" | "outline";
    size?: "default" | "sm" | "icon";
    children: React.ReactNode;
}

export function Button({
    variant = "default",
    size = "default",
    className = "",
    children,
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md";

    const variants = {
        default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800",
        destructive: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-100",
    };

    const sizes = {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 px-3 text-xs",
        icon: "h-9 w-9 p-0",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
