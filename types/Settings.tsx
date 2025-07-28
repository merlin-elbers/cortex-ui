import {JSX} from "react";
import {LucideIcon} from "lucide-react";

export interface SettingTabs {
    id: string
    label: string
    icon: LucideIcon
    component: () => JSX.Element
}