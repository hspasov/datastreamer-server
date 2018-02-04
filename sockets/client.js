import io from "socket.io-client";
import config from "../views/config";

function Socket(RTC, token, pageActionHandler) {
    this.RTC = RTC;
    this.socket = io(`http://${window.location.host}`, {
        query: `token=${token}`
    });

    this.socket.on("connect", () => {
        pageActionHandler(function () {
            this.props.setLoaderMessage("Connecting to provider...");
        });
    });

    this.socket.on("connect_error", error => {
        this.RTC.handleError({
            type: "connection",
            message: "Connection to server failed."
        });
        console.log("connect_error");
    });

    this.socket.on("connect_timeout", timeout => {
        this.RTC.handleError({
            type: "connection",
            message: "Connection to server failed."
        });
        console.log("connect_timeout");
    });

    this.socket.on("error", error => {
        this.RTC.handleError({
            type: "generic",
            message: error
        });
        console.log("error");
    });

    this.socket.on("disconnect", reason => {
        this.RTC.handleError({
            type: "connection",
            message: "Connection to server failed."
        });
        console.log("disconnect");
    });

    this.socket.on("reconnect_failed", () => {
        this.RTC.handleError({
            type: "connection",
            message: "Connection to server failed."
        });
        console.log("reconnect failed");
    });

    this.socket.on("provider_connect", () => {
        pageActionHandler(function () {
            this.props.setLoaderMessage("Provider found. Waiting for RTC request...");
        });
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
        pageActionHandler(function () {
            this.props.setLoaderMessage("Initializing P2P connection...");
        });
        this.RTC.initializeP2PConnection();
    });

    this.socket.on("description", description => {
        try {
            console.log(description);
            this.RTC.peerConnection.setRemoteDescription(JSON.parse(description));
            pageActionHandler(function () {
                this.props.setLoaderMessage("Peer negotiation...");
            });
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
            this.RTC.peerConnection.addIceCandidate(JSON.parse(candidate)).catch(error => {
                this.RTC.handleError({
                    type: "generic",
                    message: error
                });
                this.RTC.deleteP2PConnection(error);
            });
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