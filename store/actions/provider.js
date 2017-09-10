function connectClient(providerId) {
    return {
        type: "CONNECT_CLIENT",
        payload: providerId
    }
}

function disconnectClient(providerId) {
    return {
        type: "DISCONNECT_CLIENT",
        payload: null
    }
}

export {
    connectClient,
    disconnectClient
};