import io from "socket.io-client";

class Socket {
    constructor(RTC, sessionId) {
        this.RTC = RTC;
        providerName = "provider1"; // todo: replace with token
        this.socket = io(`https://${window.location.host}`, {
            query: `session_id=${sessionId}`,
            secure: true
        });

        this.socket.on("connectToProviderSuccess", () => {
            console.log("Successfully connected");
        });

        this.socket.on("connectToProviderFail", () => {
            this.RTC.deleteP2PConnection();
        });

        this.socket.on("resetConnection", () => {
            this.RTC.deleteP2PConnection();
            this.RTC.initializeP2PConnection();
        });

        this.socket.on("providerFound", () => {
            this.socket.emit("connectToProvider", providerName);
        });

        this.socket.on("requestedP2PConnection", () => {
            this.RTC.initializeP2PConnection();
        });

        this.socket.on("receiveProviderDescription", description => {
            try {
                this.RTC.peerConnection.setRemoteDescription(description);
            } catch (e) {
                if (!this.RTC.peerConnection) {
                    console.log("Connection to provider lost.");
                } else {
                    throw e;
                }
            }
        });

        this.socket.on("receiveICECandidate", candidate => {
            try {
                this.RTC.peerConnection.addIceCandidate(candidate).then(
                    () => { },
                    error => {
                        console.log("failed to add candidate", error);
                        this.RTC.deleteP2PConnection(error);
                    }
                );
            } catch (e) {
                if (!this.RTC.peerConnection) {
                    console.log("Connection to provider lost.");
                } else {
                    throw e;
                }
            }
        });

        console.log("connecting to provider", providerName);
        this.socket.emit("connectToProvider", providerName);
    }
}

export default Socket;