function loginClient(token) {
    return {
        type: "LOGIN_CLIENT",
        payload: token
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