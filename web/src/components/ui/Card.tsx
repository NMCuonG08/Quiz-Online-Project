import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = "", children, ...props }, ref) => (
        <div
            ref={ref}
            className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
            {...props}
        >
            {children}
        </div>
    )
);

Card.displayName = "Card";

export const CardHeader = ({ className = "", children, ...props }: CardProps) => (
    <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${className}`} {...props}>
        {children}
    </div>
);

export const CardContent = ({ className = "", children, ...props }: CardProps) => (
    <div className={`p-4 ${className}`} {...props}>
        {children}
    </div>
);

export const CardFooter = ({ className = "", children, ...props }: CardProps) => (
    <div className={`px-4 py-3 border-t border-gray-200 dark:border-gray-700 ${className}`} {...props}>
        {children}
    </div>
);
