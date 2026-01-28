import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "white" | "ghost";
    children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", children, ...props }, ref) => {
        const base =
            "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold tracking-wide transition-all active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

        const variants = {
            primary:
                "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25 hover:shadow-primary/40",
            secondary:
                "text-slate-900 dark:text-white border border-surface-400 dark:border-dark-400 hover:bg-surface-300 dark:hover:bg-dark-400",
            white:
                "bg-white text-slate-900 hover:bg-slate-100 shadow-xl border-none",
            ghost:
                "text-slate-600 dark:text-slate-400 hover:bg-surface-300 dark:hover:bg-dark-300",
        };

        return (
            <button
                ref={ref}
                className={cn(base, variants[variant], className)}
                {...props}
            >
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";
