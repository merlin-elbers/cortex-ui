import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
                      className,
                      classNames,
                      showOutsideDays = true,
                      ...props
                  }: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={className}
            navLayout={"after"}
            classNames={{
                months: "flex flex-col space-y-4",
                month: "space-y-4 grid grid-cols-2",
                month_caption: "flex border-b border-slate-200 p-3 items-center justify-end",
                nav: "flex border-b border-slate-200 p-3 items-center justify-end gap-2",
                caption_label: "text-base font-semibold text-indigo-500",
                month_grid: "flex flex-col px-5 col-span-2 gap-2 py-2",
                weekdays: "grid grid-cols-7 gap-1",
                weekday: "text-indigo-500",
                day_button: "h-9 w-9 text-center text-sm p-0 relative ",
                week: "grid grid-cols-7 gap-2",
                weeks: "gap-2 flex flex-col",
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "!cursor-pointer h-9 w-9 p-0 font-normal aria-selected:bg-indigo-500 aria-selected:!text-white " +
                    "data-outside:text-gray-400 data-today:border data-today:border-indigo-500"
                ),
                button_next: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-7 w-7 p-0 font-normal hover:fill-white"
                ),
                button_previous: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-7 w-7 p-0 font-normal hover:fill-white"
                ),
                ...classNames,
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export { Calendar };
