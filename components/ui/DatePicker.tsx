"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { buttonVariants } from "@/components/ui/Button";

export type DatePickerProps = {
  value?: string; // ISO date string YYYY-MM-DD
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  id,
  name,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const validSelected = selected && isValid(selected) ? selected : undefined;

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      onChange?.(format(day, "yyyy-MM-dd"));
    }
    setOpen(false);
  };

  return (
    <>
      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild disabled={disabled}>
          <button
            id={id}
            type="button"
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              !value && "text-[var(--color-muted-fg)]",
              className
            )}
          >
            <span>{validSelected ? format(validSelected, "PPP") : placeholder}</span>
            <CalendarIcon className="h-4 w-4 opacity-50" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className={cn(
              "z-50 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-md",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            )}
          >
            <DayPicker
              mode="single"
              selected={validSelected}
              onSelect={handleSelect}
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                month_caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                button_previous: cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
                ),
                button_next: cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
                ),
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex",
                weekday: "text-[var(--color-muted-fg)] rounded-[var(--radius-md)] w-9 font-normal text-[0.8rem]",
                week: "flex w-full mt-2",
                day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-[var(--radius-md)] first:[&:has([aria-selected])]:rounded-l-[var(--radius-md)] last:[&:has([aria-selected])]:rounded-r-[var(--radius-md)] focus-within:relative focus-within:z-20",
                day_button: cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                selected:
                  "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-fg)] focus:bg-[var(--color-primary)] focus:text-[var(--color-primary-fg)] rounded-[var(--radius-md)]",
                today: "bg-[var(--color-muted)] text-[var(--color-fg)] rounded-[var(--radius-md)]",
                outside: "day-outside text-[var(--color-muted-fg)] opacity-50 aria-selected:bg-[var(--color-muted)]/50 aria-selected:text-[var(--color-muted-fg)] aria-selected:opacity-30",
                disabled: "text-[var(--color-muted-fg)] opacity-50",
                hidden: "invisible",
              }}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </>
  );
}
