import io from "socket.io-client";

class Socket {
    constructor(RTC, token) {
        this.RTC = RTC;
        this.socket = io(`https://${window.location.host}`, {
            query: `token=${token}`,
            secure: true
        });

        this.socket.on("connectToProviderSuccess", () => {
            console.log("Successfully connected");
        });

        this.socket.on("connectToProviderFail", error => {
            switch (error) {
                case "TokenExpiredError":
                    console.log("Token Expired");
                    break;
                case "JsonWebTokenError":
                    console.log("JsonWebTokenError");
                    break;
                case "ProviderNotConnectedError":
                    console.log("connect to provider failed");
                    break;
                default:
                    console.log("Something went wrong...");
            }
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
                console.log("inside receiveProviderDescription:")
                console.log(description);
                this.RTC.peerConnection.setRemoteDescription(JSON.parse(description));
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
                console.log("inside receiveICECandidate");
                console.log(candidate);
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