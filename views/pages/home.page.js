import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import io from "socket.io-client";
import path from "path";

import File from "../components/file.component";
import streamSaver from 'streamsaver';

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.socket = io("http://localhost:3000", {
            query: `type=client&id=${this.props.provider.providerId}`
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
            console.log("Connect to provider failed");
        });

        this.socket.on("providerFound", () => {
            this.connectToProvider();
        });

        this.servers = null;
        this.peerConnectionConstraint = null;
        this.dataConstraint = null;
        this.peerConnection = new RTCPeerConnection(this.servers, this.peerConnectionConstraint);
        this.sendChannel = this.peerConnection.createDataChannel("sendDataChannel", this.dataConstraint);
        this.receiveChannel = this.peerConnection.createDataChannel("receiveDataChannel", this.dataConstraint);

        this.sendChannel.onopen = () => {
            this.sendChannel.send(JSON.stringify({
                action: "message",
                message: "It works, from client"
            }));
        }

        this.peerConnection.ondatachannel = event => {
            this.receiveChannel = event.channel;
            this.receiveChannel.onmessage = event => {
                this.processMessage(JSON.parse(event.data));
            }
        }

        this.processMessage = this.processMessage.bind(this);
        this.connectToProvider = this.connectToProvider.bind(this);
    }

    componentDidMount() {
        this.socket.on("receiveProviderDescription", description => {
            this.peerConnection.setRemoteDescription(description);
        });

        this.socket.on("receiveICECandidate", candidate => {
            this.peerConnection.addIceCandidate(candidate).then(
                () => {},
                error => {
                    console.log("failed to add candidate", error);
                }
            );
        });

        this.peerConnection.onicecandidate = event => {
            if (event.candidate) {
                this.socket.emit("sendICECandidate", "provider", this.props.provider.providerId, event.candidate);
            }
        };
        this.connectToProvider();
    }

    connectToProvider() {
        console.log("connecting to provider");
        this.peerConnection.createOffer().then(
            description => {
                this.peerConnection.setLocalDescription(description);
                this.socket.emit("connectToProvider", this.props.provider.providerId, description);
            },
            error => {
                console.log("there was an error creating an offer");
            }
        );
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
                this.setState({
                    files: this.state.files.concat([message.data])
                });
                break;
            case "unlink":
            case "unlinkDir":
                this.setState({
                    files: this.state.files.filter(file => {
                        return file.path !== message.data.path;
                    })
                });
                break;
            case "message":
                console.log(message.message);
                break;
        }
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
        this.sendChannel.send(JSON.stringify({
            action: "openDirectory",
            selectedDirectory: name
        }));
    }

    downloadFile(name) {
        console.log("downloading", name);
        // this.socket.emit("downloadFile", this.props.provider.providerId, name);
    }

    render() {
        if (!this.props.client.clientId) {
            return (
                <p>Please login or register</p>
            );
        }
        return (
            <div>
                <div ref="render">Hello World!</div>
                {this.state.currentDirectory &&
                <button
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
                                        <button onClick={this.downloadFile.bind(this, file.path)}>Download file</button>
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