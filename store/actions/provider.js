function connectClient(username) {
    return {
        type: "CONNECT_CLIENT",
        payload: username
    }
}

function disconnectClient() {
    return {
        type: "DISCONNECT_CLIENT",
        payload: null
    }
}

export {
    connectClient,
    disconnectClient
};