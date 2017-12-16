function loginClient(clientData) {
    return {
        type: "LOGIN_CLIENT",
        payload: clientData
    };
}

function logoutClient() {
    return {
        type: "LOGOUT_CLIENT",
        payload: null
    };
}

export {
    loginClient,
    logoutClient
};