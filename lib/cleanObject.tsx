export const cleanObject = <T extends object>(obj: T): Partial<T> => {
    return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== "" && v !== null && v !== undefined)
    ) as Partial<T>;
};
