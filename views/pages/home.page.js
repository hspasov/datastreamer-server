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
            this.state.socket.emit("getAllData", this.props.provider.providerId);
        });

        this.state.socket.on("connectToProviderFail", () => {
            console.log("Connect to provider failed");
        });

        this.state.socket.on("providerFound", () => {
            this.state.socket.emit("connectToProvider", this.props.provider.providerId);
        });

        this.state.socket.on("receiveData", metadata => {
            this.setState({
                files: this.state.files.concat([metadata])
            });
        });
    }

    componentDidMount() {
        this.state.socket.emit("connectToProvider", this.props.provider.providerId);
    }

    openDirectory(name) {
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
                                    <button onClick={this.openDirectory.bind(this, file.name)}>Open directory</button>
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