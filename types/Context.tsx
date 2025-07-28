import {UserPublic} from "@/types/User";
import {WhiteLabelConfig} from "@/types/WhiteLabel";
import {ServerStatus} from "@/types/System";

export type AuthContextType = {
    user: UserPublic | null;
    isAuthenticated: boolean;
    setupCompleted: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    refreshSetupCompleted: () => void;
    whiteLabelConfig: WhiteLabelConfig;
    serverStatus: ServerStatus;
    refreshWhiteLabelConfig: () => void;
    refreshSystemStatus: () => void;
};