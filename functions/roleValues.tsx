const getRoleValue = (roleName: string) => {
    try {
        const roleValues = {
            viewer: 0,
            writer: 1,
            editor: 2,
            admin: 3
        }
        return roleValues[roleName as keyof typeof roleValues];
    } catch {
        return 0;
    }
}

export default getRoleValue