export function deepEqual<T>(a: T, b: T): boolean {
    if (a === b) return true;

    if (
        typeof a !== 'object' || typeof b !== 'object' ||
        a === null || b === null
    ) return false;

    const keysA = Object.keys(a) as (keyof T)[];
    const keysB = Object.keys(b) as (keyof T)[];

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }

    return true;
}
