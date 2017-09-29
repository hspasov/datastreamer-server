import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import io from "socket.io-client";
import path from "path";

import File from "../components/file.component";
import FileSaver from "file-saver";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.socket = io("http://192.168.1.4:3000", {
            query: `type=client&username=${this.props.provider.username}`
        });
        this.state = {
            currentDirectory: null,
            files: []
        };

        this.socket.on("connectToProviderSuccess", () => {
            console.log("Successfully connected");
            this.setState({ files: [] });
        });

        this.socket.on("connectToProviderFail", () => {
            this.deleteP2PConnection();
        });

        this.socket.on("resetConnection", () => {
            this.deleteP2PConnection();
            this.initializeP2PConnection();
        });

        this.socket.on("providerFound", () => {
            this.connectToProvider();
        });

        this.socket.on("requestedP2PConnection", () => {
            this.initializeP2PConnection();
        });

        this.socket.on("receiveProviderDescription", description => {
            try {
                this.peerConnection.setRemoteDescription(description);
            } catch (e) {
                if (!this.peerConnection) {
                    console.log("Connection to provider lost.");
                } else {
                    throw e;
                }
            }
        });

        this.socket.on("receiveICECandidate", candidate => {
            try {
                this.peerConnection.addIceCandidate(candidate).then(
                    () => { },
                    error => {
                        console.log("failed to add candidate", error);
                        this.deleteP2PConnection(error);
                    }
                );
            } catch (e) {
                if (!this.peerConnection) {
                    console.log("Connection to provider lost.");
                } else {
                    throw e;
                }
            }
        });

        this.servers = null;
        this.peerConnectionConstraint = null;
        this.dataConstraint = null;
        this.receiveBuffer = [];
        this.receivedBytes = 0;
        this.fileSize = 0;
        this.downloads = [];

        this.deleteP2PConnection = this.deleteP2PConnection.bind(this);
        this.downloadFiles = this.downloadFiles.bind(this);
        this.processMessage = this.processMessage.bind(this);
        this.processChunk = this.processChunk.bind(this);
        this.connectToProvider = this.connectToProvider.bind(this);
        this.initializeP2PConnection = this.initializeP2PConnection.bind(this);
    }

    componentDidMount() {
        this.connectToProvider();
    }

    connectToProvider() {
        console.log("connecting to provider");
        this.socket.emit("connectToProvider", this.props.provider.username);
    }

    initializeP2PConnection() {
        try {
            console.log("requested P2P connection");
            this.peerConnection = new RTCPeerConnection(this.servers, this.peerConnectionConstraint);
            this.sendMessageChannel = this.peerConnection.createDataChannel("sendMessageChannel", this.dataConstraint);

            this.peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    console.log("sending ICE candidate", event.candidate);
                    this.socket.emit("sendICECandidate", "provider", this.props.provider.username, event.candidate);
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
                    console.log("just after set local description");
                    console.log("Offering p2p connection");
                    this.socket.emit("offerP2PConnection", this.props.provider.username, description);
                },
                error => {
                    console.log("there was an error creating an offer");
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
            this.sendMessageChannel && console.log("Closed data channel with label: " + this.sendMessageChannel.label);
            console.log(this.sendMessageChannel);
            this.sendMessageChannel && this.sendMessageChannel.close();
            console.log(this.sendMessageChannel);
            this.sendMessageChannel = null;
            this.receiveMessageChannel && console.log("Closed data channel with label: " + this.receiveMessageChannel.label);
            console.log(this.receiveMessageChannel);
            this.receiveMessageChannel && this.receiveMessageChannel.close();
            console.log(this.receiveMessageChannel);
            this.receiveMessageChannel = null;
            this.receiveFileChannel && console.log("Closed data channel with label: " + this.receiveFileChannel.label);
            console.log(this.receiveFileChannel);
            this.receiveFileChannel && this.receiveFileChannel.close();
            this.peerConnection && this.peerConnection.close();
            this.peerConnection = null;
            console.log("Closed peer connection");
            if (error) {
                this.socket.emit("resetProviderConnection", this.props.provider.providerId);
            }
        }
    }

    processMessage(message) {
        switch (message.action) {
            case "sendCurrentDirectory":
                this.setState({
                    currentDirectory: message.data.path,
                    files: []
                });
                break;
            case "add":
                this.setState({
                    files: this.state.files.concat([{
                        ...message.data,
                        download: {
                            status: "notInitialized"
                        }
                    }])
                });
                break;
            case "addDir":
                this.setState({
                    files: this.state.files.concat([message.data])
                });
                break;
            case "change":
                this.setState({
                    files: this.state.files.filter(file => {
                        return file.path !== message.data.path;
                    })
                });

                if (message.data.type === "directory") {
                    this.setState({
                        files: this.state.files.concat([message.data])
                    });
                } else {
                    this.setState({
                        files: this.state.files.concat([{
                            ...message.data,
                            download: {
                                status: "notInitialized"
                            }
                        }])
                    });
                }
                break;
            case "unlink":
            case "unlinkDir":
                this.setState({
                    files: this.state.files.filter(file => {
                        return file.path !== message.data.path;
                    })
                });
                break;
            case "sendFileMetadata":
                this.setState({
                    files: this.state.files.map(file => {
                        if (file.path === message.data.path) {
                            let download = {
                                status: "initialized",
                                mime: message.data.mime
                            };
                            return {
                                ...file,
                                download
                            };
                        } else {
                            return file;
                        }
                    })
                });
                break;
            case "message":
                console.log(message.message);
                break;
        }
    }

    processChunk(chunk) {
        this.receiveBuffer.push(chunk);
        this.receivedBytes += chunk.byteLength;
        console.log(chunk);
        if (this.receivedBytes === this.fileSize) {
            console.log("end of file");
            this.setState({
                files: this.state.files.map(file => {
                    if (file.path === this.downloads[0]) {
                        let received = new Blob(this.receiveBuffer, file.mime);
                        console.log(received);
                        let download = {
                            ...file.download,
                            status: "downloaded",
                            link: URL.createObjectURL(received),
                            name: file.path
                        };
                        FileSaver.saveAs(received, path.basename(download.name));
                        this.receiveBuffer = [];
                        this.receivedBytes = 0;
                        this.fileSize = 0;
                        return {
                            ...file,
                            download
                        };
                    } else {
                        return file;
                    }
                })
            });
            this.downloads.shift();
            if (this.downloads.length === 1) {
                this.downloadFiles();
            }
        } else {
            console.log(`${this.receivedBytes}/${this.fileSize}`);
        }
        console.log(new Uint8Array(chunk));
    }

    openDirectory(name) {
        if (name === this.state.currentDirectory) {
            console.log("You are already in root directory!");
            return;
        }
        this.setState({
            currentDirectory: name,
            files: []
        });
        console.log("Opening directory", name);
        try {
            this.sendMessageChannel.send(JSON.stringify({
                action: "openDirectory",
                selectedDirectory: name
            }));
        } catch (e) {
            if (!this.sendMessageChannel) {
                console.log("Can't finish task. Connection to provider lost.");
            } else {
                throw e;
            }
        }
    }

    addToDownloads(filePath) {
        this.downloads.push(filePath);
        if (this.downloads.length === 1) {
            this.downloadFiles();
        }
    }

    downloadFiles() {
        try {
            let filePath = this.downloads[0];
            let file = this.state.files.filter(file => file.path === filePath)[0];
            this.fileSize = file.size;
            console.log("downloading", filePath);
            this.sendMessageChannel.send(JSON.stringify({
                action: "downloadFile",
                filePath: filePath
            }));
        } catch (e) {
            if (!this.sendMessageChannel) {
                console.log("Can't finish task. Connection to provider lost.");
            } else {
                throw e;
            }
        }
    }

    render() {
        if (!this.props.client.username) {
            return (
                <p>Please login or register</p>
            );
        }
        return (
            <div>
                <div ref="render">Hello World!</div>
                {this.state.currentDirectory &&
                <button
                    disabled={path.dirname(this.state.currentDirectory) === this.state.currentDirectory}
                    onClick={this.openDirectory.bind(this, path.dirname(this.state.currentDirectory))}>
                    Go back
                </button>
                }
                {this.state.files.map((file, i) => {
                        return (
                            <div key={file.path}>
                                <File
                                    name={file.name}
                                    type={file.type}
                                    size={file.size}
                                    access={file.access}
                                />
                                <p>{
                                    (file.type == "directory") ?
                                        <button onClick={this.openDirectory.bind(this, file.path)}>Open directory</button> :
                                        <button onClick={this.addToDownloads.bind(this, file.path)}>Download file</button>
                                }</p>
                                <hr />
                            </div>
                        )
                })}
            </div>
        );
    }
}

const HomePage = connect(store => {
    return {
        client: store.client,
        provider: store.provider
    };
})(Home);

export default HomePage;