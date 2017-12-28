import io from "socket.io-client";

function Socket(RTC, token) {
    this.RTC = RTC;
    this.socket = io(`https://${window.location.host}`, {
        query: `token=${token}`,
        secure: true
    });

    // this.socket.on("connect", () => {
    //     pageAccessor(function () {
    //         this.statusHandler({ event: "connect" });
    //     });
    // });

    this.socket.on("connect_error", error => {
        this.RTC.handleError({
            type: "connection",
            message: "Connection to server failed."
        });
    });

    this.socket.on("connect_timeout", timeout => {
        this.RTC.handleError({
            type: "connection",
            message: "Connection to server failed."
        });
    });

    this.socket.on("error", error => {
        this.RTC.handleError({
            type: "generic",
            message: error
        });
    });

    this.socket.on("disconnect", reason => {
        this.RTC.handleError({
            type: "connection",
            message: "Connection to server failed."
        });
    });

    this.socket.on("reconnect_failed", () => {
        this.RTC.handleError({
            type: "connection",
            message: "Connection to server failed."
        });
    });

    this.socket.on("provider_connect", () => {
        console.log("Successfully connected");
    });

    this.socket.on("connect_reject", error => {
        switch (error) {
            case "TokenExpiredError":
                this.RTC.handleError({
                    type: "sessionExpired",
                    message: "Session has expired. Please authenticate again!"
                });
                break;
            case "ProviderNotConnectedError":
                this.RTC.handleError({
                    type: "connection",
                    message: "Connection to provider failed."
                });
                break;
            default:
                this.RTC.handleError({
                    type: "generic",
                    message: `Unknown error. Code: ${error}`
                });
        }
        this.RTC.deleteP2PConnection();
    });

    this.socket.on("connect_reset", () => {
        this.RTC.deleteP2PConnection();
        this.RTC.initializeP2PConnection();
    });

    this.socket.on("p2p_request", () => {
        this.RTC.initializeP2PConnection();
    });

    this.socket.on("description", description => {
        try {
            console.log(description);
            this.RTC.peerConnection.setRemoteDescription(JSON.parse(description));
        } catch (error) {
            if (!this.RTC.peerConnection) {
                this.RTC.handleError({
                    type: "connection",
                    message: "Connection to provider failed."
                });
            } else {
                this.RTC.handleError({
                    type: "generic",
                    message: error
                });
            }
        }
    });

    this.socket.on("ice_candidate", candidate => {
        try {
            console.log("inside ice_candidate");
            console.log(candidate);
            this.RTC.peerConnection.addIceCandidate(JSON.parse(candidate)).then(
                () => { },
                error => {
                    this.RTC.handleError({
                        type: "generic",
                        message: error
                    });
                    this.RTC.deleteP2PConnection(error);
                }
            );
        } catch (error) {
            if (!this.RTC.peerConnection) {
                this.RTC.handleError({
                    type: "connection",
                    message: "Connection to provider failed."
                });
            } else {
                this.RTC.handleError({
                    type: "generic",
                    message: error
                });
            }
        }
    });

    this.socket.on("token_request", () => {
        this.socket.emit("token_response", token);
    });

    console.log("connecting to provider");
}

export default Socket;