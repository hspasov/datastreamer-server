function connectClient(connectionData) {
    return {
        type: "CONNECT_CLIENT",
        payload: connectionData
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