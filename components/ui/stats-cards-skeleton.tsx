import {cn} from "@/lib/utils"

interface StatsCardsSkeletonProps {
    className?: string
}

function StatsCardsSkeleton({className}: StatsCardsSkeletonProps) {
    return (
        <div
            className={cn("bg-slate-50 border border-slate-200 rounded-lg p-6 animate-pulse", className)}
        >
            <div className={"flex items-start justify-between"}>
                <div className={"flex-1"}>
                    <div className={"h-4 bg-slate-200 rounded w-16 mb-3"}></div>

                    <div className={"h-8 bg-slate-200 rounded w-20 mb-2"}></div>

                    <div className={"h-3 bg-slate-200 rounded w-24"}></div>
                </div>

                <div className={"w-10 h-10 bg-slate-200 rounded-full ml-4"}></div>
            </div>
        </div>
    )
}

export {StatsCardsSkeleton}