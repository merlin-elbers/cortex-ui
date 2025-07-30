'use client'

export async function fetchWithAuth(
    input: RequestInfo,
    init: RequestInit = {}
): Promise<Response> {
    const token = localStorage.getItem("access_token");

    const headers: HeadersInit = {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const res = await fetch(input, {
        ...init,
        headers,
    });

    if (res.status === 401) {
        localStorage.removeItem("access_token")
        window.location.href = "/login?session_expired"
    }

    return res;
}