import {cn} from "@/lib/utils"

interface ListPanelsSkeletonProps {
    className?: string
}

function ListPanelsSkeleton({className}: ListPanelsSkeletonProps) {
    return (
        <div
            className={cn("bg-slate-50 border border-slate-200 rounded-lg p-6 animate-pulse", className)}
        >
            <div className={"h-5 bg-slate-200 rounded w-32 mb-6"}></div>
            <div className={"space-y-4"}>
                {Array.from({length: 5}).map((_, itemIndex) => (
                    <div key={itemIndex} className={"flex items-center gap-4"}>
                        <div className={"w-8 h-8 bg-slate-200 rounded-full flex-shrink-0"}></div>

                        <div className={"flex-1 min-w-0"}>
                            <div className={"h-4 bg-slate-200 rounded w-24 mb-1"}></div>
                            <div className={"h-3 bg-slate-200 rounded w-16"}></div>
                        </div>

                        <div className={"h-4 bg-slate-200 rounded w-16 flex-shrink-0"}></div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export {ListPanelsSkeleton}