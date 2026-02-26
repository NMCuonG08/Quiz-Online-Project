"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";

// ============================================
// Simple Dropdown Menu Components (Tailwind)
// ============================================

interface DropdownState {
    isOpen: boolean;
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative inline-block">
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, {
                        isOpen,
                        setIsOpen
                    });
                }
                return child;
            })}
        </div>
    );
}

export function DropdownMenuTrigger({ children, asChild, isOpen, setIsOpen }: any) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen?.(!isOpen);
    };

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: handleClick
        });
    }
    return <button onClick={handleClick}>{children}</button>;
}

export function DropdownMenuContent({ children, align = "end", isOpen, setIsOpen }: any) {
    if (!isOpen) return null;

    return (
        <div
            className={`absolute ${align === "end" ? "right-0" : "left-0"} top-full mt-1 min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 py-1`}
            onClick={(e) => e.stopPropagation()}
        >
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, { setIsOpen });
                }
                return child;
            })}
        </div>
    );
}

export function DropdownMenuItem({ children, onClick, className = "", setIsOpen, ...props }: any) {
    return (
        <button
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center ${className}`}
            onClick={(e) => {
                onClick?.(e);
                setIsOpen?.(false);
            }}
            {...props}
        >
            {children}
        </button>
    );
}

export function DropdownMenuSeparator() {
    return <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />;
}

export function DropdownMenuSub({ children }: { children: React.ReactNode }) {
    const [isSubOpen, setIsSubOpen] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsSubOpen(true)}
            onMouseLeave={() => setIsSubOpen(false)}
        >
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, { isSubOpen });
                }
                return child;
            })}
        </div>
    );
}

export function DropdownMenuSubTrigger({ children, isSubOpen, ...props }: any) {
    return (
        <div
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between cursor-pointer"
            {...props}
        >
            <span className="flex items-center">{children}</span>
            <ChevronRight className="h-4 w-4" />
        </div>
    );
}

export function DropdownMenuSubContent({ children, isSubOpen }: any) {
    if (!isSubOpen) return null;

    return (
        <div className="absolute left-full top-0 ml-1 min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 py-1">
            {children}
        </div>
    );
}
