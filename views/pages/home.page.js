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

        // this.socket.on("receiveDirectoryData", data => {
        //     this.setState({ currentDirectory: data, files: [] });
        //     console.log("received dir:", data);
        // });

        // this.socket.on("receiveData", data => {
        //     if (!data) {
        //         console.log("Provider's configuration does not allow to send data to this client. ");
        //     } else {
        //         console.log(data);
        //         this.processData(data);
        //     }
        // });

        // this.socket.on("streamFile", stream => {
        //     console.log("streaming started");
        //     console.log(stream);
        // });

        this.servers = null;
        this.peerConnectionConstraint = null;
        this.dataConstraint = null;
        this.peerConnection = new RTCPeerConnection(this.servers, this.peerConnectionConstraint);
        console.log("created peer connection", this.peerConnection);
        this.sendChannel = this.peerConnection.createDataChannel("sendDataChannel", this.dataConstraint);
        console.log("created send channel", this.sendChannel);
        this.receiveChannel = this.peerConnection.createDataChannel("receiveDataChannel", this.dataConstraint);
        console.log("created recieve channel", this.receiveChannel);

        this.sendChannel.onopen = () => {
            console.log("Send channel is ", this.sendChannel.readyState);
            this.sendChannel.send("It works, from client");
        }

        this.peerConnection.ondatachannel = event => {
            console.log("Receive channel callback");
            this.receiveChannel = event.channel;
            this.receiveChannel.onmessage = event => {
                console.log("Message: ", event.data);
            }
        }

        this.processData = this.processData.bind(this);
        this.connectToProvider = this.connectToProvider.bind(this);
    }

    componentDidMount() {
        this.connectToProvider();
    }

    connectToProvider() {
        this.socket.on("receiveProviderDescription", description => {
            console.log("setting remote description", description);
            this.peerConnection.setRemoteDescription(description);
        });

        this.socket.on("receiveICECandidate", candidate => {
            console.log("receiving ICE Candidate", candidate);
            this.peerConnection.addIceCandidate(candidate).then(
                () => {
                    console.log("added ice candidate");
                },
                error => {
                    console.log("failed to add candidate", error);
                }
            );
        });

        this.peerConnection.onicecandidate = event => {
            console.log("ice callback");
            if (event.candidate) {
                console.log("sending candidate", event.candidate);
                this.socket.emit("sendICECandidate", "provider", this.props.provider.providerId, event.candidate);
            }
        };

        this.peerConnection.createOffer().then(
            description => {
                console.log("setting local description", description);
                this.peerConnection.setLocalDescription(description);
                console.log("Offer from localConnection \n" + description.sdp);
                this.socket.emit("connectToProvider", this.props.provider.providerId, description);
            },
            error => {
                console.log("there was an error creating an offer");
            }
        );
    }

    processData(data) {
        switch (data.action) {
            case "add":
            case "addDir":
                this.setState({
                    files: this.state.files.concat([data.value])
                });
                break;
            case "change":
                this.setState({
                    files: this.state.files.filter(file => {
                        return file.path !== data.value.path;
                    })
                });
                this.setState({
                    files: this.state.files.concat([data.value])
                });
                break;
            case "unlink":
            case "unlinkDir":
                this.setState({
                    files: this.state.files.filter(file => {
                        return file.path !== data.value.path;
                    })
                });
                break;
        }
    }

    openDirectory(name) {
        if (name === this.state.currentDirectory.path) {
            console.log("You are already in root directory!");
            return;
        }
        this.setState({ files: [] });
        console.log("Opening directory", name);
        // this.socket.emit("openDirectory", this.props.provider.providerId, name);
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
                    onClick={this.openDirectory.bind(this, path.dirname(this.state.currentDirectory.path))}>
                    Go back
                </button>
                }
                {this.state.files.map((file, i) => {
                    {/* if (i > 0) { */}
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
                    {/* } */}
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