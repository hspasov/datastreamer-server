import io from "socket.io-client";
// import setState from "../views/pages/home.page";

class Socket {
    constructor(RTC, providerName) {
        this.RTC = RTC;
        this.socket = io("http://192.168.1.4:3000", {
            query: `type=client&username=${providerName}`
        });

        this.socket.on("connectToProviderSuccess", () => {
            console.log("Successfully connected");
            // setState({ files: [] });
        });

        this.socket.on("connectToProviderFail", () => {
            this.RTC.deleteP2PConnection();
        });

        this.socket.on("resetConnection", () => {
            this.RTC.deleteP2PConnection();
            this.RTC.initializeP2PConnection();
        });

        this.socket.on("providerFound", () => {
            console.log("connecting to provider");
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

        console.log("connecting to provider");
        this.socket.emit("connectToProvider", providerName);
    }
}

export default Socket;