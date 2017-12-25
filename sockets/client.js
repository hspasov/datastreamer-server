import io from "socket.io-client";

function Socket(RTC, token, errorHandler) {
    this.RTC = RTC;
    this.socket = io(`https://${window.location.host}`, {
        query: `token=${token}`,
        secure: true
    });

    this.errorHandler = errorHandler;

    // this.socket.on("connect", () => {
    //     pageAccessor(function () {
    //         this.statusHandler({ event: "connect" });
    //     });
    // });

    this.socket.on("connect_error", error => {
        this.errorHandler({
            type: "connection",
            message: "Connection to server failed."
        });
    });

    this.socket.on("connect_timeout", timeout => {
        this.errorHandler({
            type: "connection",
            message: "Connection to server failed."
        });
    });

    this.socket.on("error", error => {
        this.errorHandler({
            type: "generic",
            message: error
        });
    });

    this.socket.on("disconnect", reason => {
        this.errorHandler({
            type: "connection",
            message: "Connection to server failed."
        });
    });

    this.socket.on("reconnect_failed", () => {
        this.errorHandler({
            type: "connection",
            message: "Connection to server failed."
        });
    });

    this.socket.on("connectToProviderSuccess", () => {
        console.log("Successfully connected");
    });

    this.socket.on("connectToProviderFail", error => {
        switch (error) {
            case "TokenExpiredError":
                this.errorHandler({
                    type: "sessionExpired",
                    message: "Session has expired. Please authenticate again!"
                });
                break;
            case "JsonWebTokenError":
                this.errorHandler({
                    type: "invalidToken",
                    message: "Authentication failed. Server received an invalid token."
                });
                break;
            case "ProviderNotConnectedError":
                this.errorHandler({
                    type: "connection",
                    message: "Connection to provider failed."
                });
                break;
            default:
                this.errorHandler({
                    type: "generic",
                    message: `Unknown error. Code: ${error}`
                });
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
        } catch (error) {
            if (!this.RTC.peerConnection) {
                this.errorHandler({
                    type: "connection",
                    message: "Connection to provider failed."
                });
            } else {
                this.errorHandler({
                    type: "generic",
                    message: error
                });
            }
        }
    });

    this.socket.on("receiveICECandidate", candidate => {
        try {
            console.log("inside receiveICECandidate");
            console.log(candidate);
            this.RTC.peerConnection.addIceCandidate(JSON.parse(candidate)).then(
                () => { },
                error => {
                    this.errorHandler({
                        type: "generic",
                        message: error
                    });
                    this.RTC.deleteP2PConnection(error);
                }
            );
        } catch (error) {
            if (!this.RTC.peerConnection) {
                this.errorHandler({
                    type: "connection",
                    message: "Connection to provider failed."
                });
            } else {
                this.errorHandler({
                    type: "generic",
                    message: error
                });
            }
        }
    });

    this.socket.on("requestToken", () => {
        this.socket.emit("provideToken", token);
    });

    console.log("connecting to provider");
}

export default Socket;