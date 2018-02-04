import Socket from "../sockets/client";

class RTC {
    constructor(connectData, handlers) {
        this.socket = new Socket(this, connectData.connectionToken, handlers.pageActionHandler).socket;
        this.servers = null;
        this.peerConnectionConstraint = null;
        this.dataConstraint = null;

        this.writeAccess = connectData.writeAccess;
        this.handleMessage = handlers.handleMessage;
        this.handleChunk = handlers.handleChunk;
        this.handleError = handlers.handleError;

        this.peerConnection = null;
        this.sendMessageChannel = null;
        this.sendMessageWritableChannel = null;
        this.sendFileChannel = null;
        this.receiveMessageChannel = null;
        this.receiveFileChannel = null;

        this.bufferLimit = 15 * 1024 * 1024; // 15 MB, WebRTC fails at 16 MB
        this.chunkSize = 32 * 1024; // 32 KB

        this.downloads = [];
    }

    initializeP2PConnection() {
        console.log("requested P2P connection");
        this.peerConnection = new RTCPeerConnection();
        this.sendMessageChannel = this.peerConnection.createDataChannel("clientMessage", this.dataConstraint);
        if (this.writeAccess) {
            this.sendMessageWritableChannel = this.peerConnection.createDataChannel("clientMessageWritable", this.dataConstraint);
            this.sendFileChannel = this.peerConnection.createDataChannel("clientFile", this.dataConstraint);
            this.sendFileChannel.binaryType = "arraybuffer";
            this.sendFileChannel.bufferedAmountLowThreshold = 1 * 1024 * 1024; // 1 MB
        }

        this.peerConnection.onicecandidate = event => {
            if (event.candidate) {
                console.log("sending ICE candidate", event.candidate);
                this.socket.emit("ice_candidate", JSON.stringify(event.candidate));
            }
        };

        this.peerConnection.ondatachannel = event => {
            switch (event.channel.label) {
                case "providerMessage":
                    console.log("found providerMessage datachannel");
                    this.receiveMessageChannel = event.channel;
                    this.receiveMessageChannel.onmessage = event => {
                        this.handleMessage(JSON.parse(event.data));
                    };
                    break;
                case "providerFile":
                    this.receiveFileChannel = event.channel;
                    this.receiveFileChannel.binaryType = "arraybuffer";
                    this.receiveFileChannel.onmessage = event => {
                        this.handleChunk(event.data);
                    };
                    break;
            }
        }

        this.peerConnection.createOffer().then(description => {
            console.log("set local description", description);
            return this.peerConnection.setLocalDescription(description);
        }).then(() => {
            this.socket.emit("description", JSON.stringify(this.peerConnection.localDescription));
        }).catch(error => {
            this.handleError({
                type: "generic",
                message: error
            });
            this.deleteP2PConnection(error);
        });
    }

    sendMessage(type, payload) {
        try {
            this.sendMessageChannel.send(JSON.stringify({ type, payload }));
        } catch (error) {
            if (!this.sendMessageChannel) {
                this.handleError({
                    type: "connection",
                    message: "Connection to provider failed."
                });
            } else {
                this.handleError({
                    type: "generic",
                    message: error
                });
            }
        }
    }

    sendMessageWritable(type, payload) {
        try {
            console.log(payload);
            this.sendMessageWritableChannel.send(JSON.stringify({ type, payload }));
        } catch (error) {
            if (!this.sendMessageWritableChannel) {
                this.handleError({
                    type: "connection",
                    message: "Connection to provider failed."
                });
            } else {
                this.handleError({
                    type: "generic",
                    message: error
                });
            }
        }
    }

    deleteP2PConnection(error = null) {
        this.sendMessageChannel && this.sendMessageChannel.close();
        this.receiveMessageChannel && this.receiveMessageChannel.close();
        this.receiveFileChannel && this.receiveFileChannel.close();
        this.peerConnection && this.peerConnection.close();
        if (error) {
            console.log("There was an error", error);
            this.socket.emit("connect_reset");
        }
    }
}

export default RTC;