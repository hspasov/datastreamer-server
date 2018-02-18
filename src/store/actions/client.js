function loginClient(clientData) {
    return {
        type: "LOGIN_CLIENT",
        payload: clientData
    };
}

function logoutClient() {
    return { type: "LOGOUT_CLIENT" };
}

export {
    loginClient,
    logoutClient
};