function connectClient(token) {
    return {
        type: "CONNECT_CLIENT",
        payload: token
    };
}

function disconnectClient() {
    return {
        type: "DISCONNECT_CLIENT",
        payload: null
    };
}

export {
    connectClient,
    disconnectClient
};