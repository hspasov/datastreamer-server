export function connectClient(providerId) {
    return {
        type: "CONNECT_CLIENT",
        payload: providerId
    }
}

export function disconnectClient(providerId) {
    return {
        type: "DISCONNECT_CLIENT",
        payload: null
    }
}