import Socket from "../sockets/client";

class RTC {
    constructor(providerName, processMessage, processChunk) {
        this.socket = new Socket(this, providerName).socket;
        this.servers = null;
        this.peerConnectionConstraint = null;
        this.dataConstraint = null;

        this.providerName = providerName;
        this.processMessage = processMessage;
        this.processChunk = processChunk;

        this.peerConnection = null;
        this.sendMessageChannel = null;
        this.receiveMessageChannel = null;

        this.receiveBuffer = [];
        this.receivedBytes = 0;
        this.fileSize = 0;
        this.downloads = [];

        this.initializeP2PConnection = this.initializeP2PConnection.bind(this);
        this.deleteP2PConnection = this.deleteP2PConnection.bind(this);
    }

    initializeP2PConnection() {
        try {
            console.log("requested P2P connection");
            this.peerConnection = new RTCPeerConnection(this.servers, this.peerConnectionConstraint);
            this.sendMessageChannel = this.peerConnection.createDataChannel("sendMessageChannel", this.dataConstraint);

            this.peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    console.log("sending ICE candidate", event.candidate);
                    this.socket.emit("sendICECandidate", "provider", this.providerName, event.candidate);
                }
            };

            this.sendMessageChannel.onopen = () => {
                this.sendMessageChannel.send(JSON.stringify({
                    action: "message",
                    message: "It works, from client"
                }));
            }

            this.peerConnection.ondatachannel = event => {
                switch (event.channel.label) {
                    case "sendMessageChannel":
                        this.receiveMessageChannel = event.channel;
                        this.receiveMessageChannel.onmessage = event => {
                            this.processMessage(JSON.parse(event.data));
                        };
                        break;
                    case "sendFileChannel":
                        this.receiveFileChannel = event.channel;
                        this.receiveFileChannel.binaryType = "arraybuffer";
                        this.receiveFileChannel.onmessage = event => {
                            this.processChunk(event.data);
                        };
                        break;
                }
            }

            this.peerConnection.createOffer().then(
                description => {
                    this.peerConnection.setLocalDescription(description);
                    console.log("set local description", description);
                    this.socket.emit("offerP2PConnection", this.providerName, description);
                },
                error => {
                    console.log("there was an error creating an offer", error);
                    this.deleteP2PConnection(error);
                }
            );
        } catch (e) {
            if (!this.peerConnection || !this.sendMessageChannel || !this.receiveFileChannel || !this.receiveMessageChannel) {
                console.log("Connection to provider lost.");
            } else {
                throw e;
            }
        }
    }

    deleteP2PConnection(error = null) {
        if (this.peerConnection) {
            console.log("Connect to provider failed");
            this.sendMessageChannel && console.log("Closed data channel with label: ", this.sendMessageChannel.label);
            console.log(this.sendMessageChannel);
            this.sendMessageChannel && this.sendMessageChannel.close();
            console.log(this.sendMessageChannel);
            this.sendMessageChannel = null;
            this.receiveMessageChannel && console.log("Closed data channel with label: ", this.receiveMessageChannel.label);
            console.log(this.receiveMessageChannel);
            this.receiveMessageChannel && this.receiveMessageChannel.close();
            console.log(this.receiveMessageChannel);
            this.receiveMessageChannel = null;
            this.receiveFileChannel && console.log("Closed data channel with label: ", this.receiveFileChannel.label);
            console.log(this.receiveFileChannel);
            this.receiveFileChannel && this.receiveFileChannel.close();
            this.peerConnection && this.peerConnection.close();
            this.peerConnection = null;
            console.log("Closed peer connection");
            if (error) {
                console.log("There was an error", error);
                this.socket.emit("resetProviderConnection", this.providerName);
            }
        }
    }
}

export default RTC;