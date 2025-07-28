export type UserPublic = {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    lastSeen: Date | string;
};
