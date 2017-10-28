import io from "socket.io-client";

class Socket {
    constructor(RTC, token) {
        this.RTC = RTC;
        this.socket = io(`http://${window.location.host}`, {
            query: `token=${token}`
        });

        this.socket.on("connectToProviderSuccess", () => {
            console.log("Successfully connected");
        });

        this.socket.on("connectToProviderFail", () => {
            console.log("connect to provider failed");
            this.RTC.deleteP2PConnection();
        });

        this.socket.on("resetConnection", () => {
            this.RTC.deleteP2PConnection();
            this.RTC.initializeP2PConnection();
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

        console.log("connecting to provider");
    }
}

export default Socket;