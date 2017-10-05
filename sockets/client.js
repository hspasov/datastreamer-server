import io from "socket.io-client";

class Socket {
    constructor(RTC, providerName) {
        this.RTC = RTC;
        this.socket = io("http://localhost:3000", {
            query: `type=client&username=${providerName}`
        });

        this.socket.on("connectToProviderSuccess", () => {
            console.log("Successfully connected, inside connectToProviderSuccess socket event");
        });

        this.socket.on("connectToProviderFail", () => {
            console.log("Inside connectToProviderFail socket event, triggering this.RTC.deleteP2PConnection");
            this.RTC.deleteP2PConnection();
        });

        this.socket.on("resetConnection", () => {
            console.log("Inside resetConnection socket event, triggering this.RTC.deleteP2PConnection and this.RTC.initializeP2PConnection");
            this.RTC.deleteP2PConnection();
            this.RTC.initializeP2PConnection();
        });

        this.socket.on("providerFound", () => {
            console.log("connecting to provider, inside providerFound socket event, emitting connectToProvider with argument providerName=", providerName);
            this.socket.emit("connectToProvider", providerName);
        });

        this.socket.on("requestedP2PConnection", () => {
            console.log("Inside requestedP2PConnection socket event, triggering this.RTC.initializeP2PConnection");
            this.RTC.initializeP2PConnection();
        });

        this.socket.on("receiveProviderDescription", description => {
            console.log("Inside receiveProvider socket event, setting remote description", description);
            try {
                this.RTC.peerConnection.setRemoteDescription(description);
            } catch (e) {
                if (!this.RTC.peerConnection) {
                    console.log("Connection to provider lost.");
                } else {
                    throw e;
                }
            }
            console.log("peerConnection state", this.RTC.peerConnection.connectionState);
            console.log("current local description", this.RTC.peerConnection.currentLocalDescription);
            console.log("current remote description", this.RTC.peerConnection.currentRemoteDescription);
            console.log("local description", this.RTC.peerConnection.localDescription);
            console.log("remote description", this.RTC.peerConnection.remoteDescription);
            console.log("pending local description", this.RTC.peerConnection.pendingLocalDescription);
            console.log("pending remote description", this.RTC.peerConnection.pendingRemoteDescription);
        });

        this.socket.on("receiveICECandidate", candidate => {
            console.log("Inside receiveICECandidate socket event, adding ICE candidate", candidate);
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
            console.log("peerConnection state", this.RTC.peerConnection.connectionState);
            console.log("current local description", this.RTC.peerConnection.currentLocalDescription);
            console.log("current remote description", this.RTC.peerConnection.currentRemoteDescription);
            console.log("local description", this.RTC.peerConnection.localDescription);
            console.log("remote description", this.RTC.peerConnection.remoteDescription);
            console.log("pending local description", this.RTC.peerConnection.pendingLocalDescription);
            console.log("pending remote description", this.RTC.peerConnection.pendingRemoteDescription);
        });

        console.log("connecting to provider", providerName);
        this.socket.emit("connectToProvider", providerName);
        console.log("peerConnection state", this.RTC.peerConnection.connectionState);
        console.log("current local description", this.RTC.peerConnection.currentLocalDescription);
        console.log("current remote description", this.RTC.peerConnection.currentRemoteDescription);
        console.log("local description", this.RTC.peerConnection.localDescription);
        console.log("remote description", this.RTC.peerConnection.remoteDescription);
        console.log("pending local description", this.RTC.peerConnection.pendingLocalDescription);
        console.log("pending remote description", this.RTC.peerConnection.pendingRemoteDescription);
    }
}

export default Socket;