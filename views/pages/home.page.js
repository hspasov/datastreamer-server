import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import io from "socket.io-client";
import path from "path";

import File from "../components/file.component";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            files: [],
            socket: io("http://localhost:3000", {
                query: `type=client&id=${this.props.provider.providerId}`
            })
        };

        this.state.socket.on("connectToProviderSuccess", () => {
            console.log("Successfully connected");
            this.setState({
                files: []
            });
            this.state.socket.emit("getAllData", this.props.provider.providerId);
        });

        this.state.socket.on("connectToProviderFail", () => {
            console.log("Connect to provider failed");
        });

        this.state.socket.on("providerFound", () => {
            this.state.socket.emit("connectToProvider", this.props.provider.providerId);
        });

        this.state.socket.on("receiveData", data => {
            if (!data) {
                console.log("Provider's configuration does not allow to send data to this client. ");
            } else {
                this.processData(data);
            }
        });

        this.processData = this.processData.bind(this);
    }

    componentDidMount() {
        this.state.socket.emit("connectToProvider", this.props.provider.providerId);
    }

    processData(data) {
        switch (data.action) {
            case "init":
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
                        return file !== data.value;
                    })
                });
                break;
        }
    }

    openDirectory(name) {
        if (name === this.state.files[0].path) {
            console.log("You are already in root directory!");
            return;
        }
        this.setState({
            files: []
        });
        this.state.socket.emit("openDirectory", this.props.provider.providerId, name);
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
                { this.state.files.length > 0 &&
                <button
                    onClick={this.openDirectory.bind(this, path.dirname(this.state.files[0].path))}>
                    Go back
                </button>
                }
                {this.state.files.map((file, i) => {
                    if (i > 0) {
                        return (
                            <div key={file.path}>
                                <File
                                    name={file.name}
                                    type={file.type}
                                    size={file.size}
                                    access={file.access}
                                />
                                <p>{
                                    file.type == "directory" &&
                                    <button onClick={this.openDirectory.bind(this, file.path)}>Open directory</button>
                                }</p>
                                <hr />
                            </div>
                        )
                    }
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