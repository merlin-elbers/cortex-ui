import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {base64url, jwtDecrypt} from "jose";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export async function verifyToken(token: string)  {
    try {
        const accessSecret = base64url.decode(process.env.JWT_SECRET as string)
        const { payload } = await jwtDecrypt(token, accessSecret)
        return payload
    } catch {
        return null;
    }
}
