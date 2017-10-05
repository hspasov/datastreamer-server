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
            console.log("created peerConnection", this.peerConnection);
            this.sendMessageChannel = this.peerConnection.createDataChannel("sendMessageChannel", this.dataConstraint);
            console.log("created sendMessageChannel", this.sendMessageChannel);

            this.peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    console.log("sending ICE candidate", event.candidate);
                    this.socket.emit("sendICECandidate", "provider", this.providerName, event.candidate);
                }
            };
            console.log("added event listener peerConnection.onicecandidate", this.peerConnection.onicecandidate);

            this.sendMessageChannel.onopen = () => {
                console.log("sendMessageChannel is open!");
                console.log("Sending hello message to provider");
                this.sendMessageChannel.send(JSON.stringify({
                    action: "message",
                    message: "It works, from client"
                }));
            }

            console.log("added event listener sendMessageChannel.onopen", this.sendMessageChannel.onopen);

            this.peerConnection.ondatachannel = event => {
                console.log("There is a datachannel with label", event.channel.label);
                switch (event.channel.label) {
                    case "sendMessageChannel":
                        console.log("Inside sendMessageChannel case, setting receiveMessageChannel");
                        this.receiveMessageChannel = event.channel;
                        this.receiveMessageChannel.onmessage = event => {
                            console.log("A message received but has to be processed!");
                            this.processMessage(JSON.parse(event.data));
                        };
                        console.log("Set event listener receiveMessageChannel.onmessage", this.receiveMessageChannel.onmessage);
                        break;
                    case "sendFileChannel":
                        console.log("Inside sendFileChannel case, setting receiveFileChannel");
                        this.receiveFileChannel = event.channel;
                        this.receiveFileChannel.binaryType = "arraybuffer";
                        this.receiveFileChannel.onmessage = event => {
                            this.processChunk(event.data);
                        };
                        console.log("Set event listener receiveFileChannel.onmessage", this.receiveFileChannel.onmessage);
                        break;
                }
            }

            console.log("added event listener peerConnection.ondatachannel", this.peerConnection.ondatachannel);

            this.peerConnection.createOffer().then(
                description => {
                    this.peerConnection.setLocalDescription(description);
                    console.log("set local description", description);
                    this.socket.emit("offerP2PConnection", this.providerName, description);
                    console.log("socket emited offerP2PConnection with params providerName and description:", this.providerName, description);
                },
                error => {
                    console.log("there was an error creating an offer", error);
                    this.deleteP2PConnection(error);
                }
            );

            console.log("created offer");
            console.log("peerConnection state", this.peerConnection.connectionState);
            console.log("current local description", this.peerConnection.currentLocalDescription);
            console.log("current remote description", this.peerConnection.currentRemoteDescription);
            console.log("local description", this.peerConnection.localDescription);
            console.log("remote description", this.peerConnection.remoteDescription);
            console.log("pending local description", this.peerConnection.pendingLocalDescription);
            console.log("pending remote description", this.peerConnection.pendingRemoteDescription);
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
                console.log("But will try to reset connection, emitting resetProviderConnection to socket");
                this.socket.emit("resetProviderConnection", this.providerName);
            }
        }
    }
}

export default RTC;