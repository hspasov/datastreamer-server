function loginClient(client) {
    return {
        type: "LOGIN_CLIENT",
        payload: client
    }
}

function logoutClient() {
    return {
        type: "LOGOUT_CLIENT",
        payload: null
    }
}

export {
    loginClient,
    logoutClient
};