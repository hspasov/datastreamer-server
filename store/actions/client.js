export function loginClient(client) {
    return {
        type: "LOGIN_CLIENT",
        payload: client
    }
}

export function logoutClient() {
    return {
        type: "LOGOUT_CLIENT",
        payload: client
    }
}