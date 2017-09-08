import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import io from "socket.io-client";

import File from "../components/file.component";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            files: [],
            socket: io("http://localhost:3000", {
                query: `type=client&id=${this.props.client.clientId}`
            })
        };

        this.state.socket.on("connectToProviderSuccess", () => {
            this.state.socket.emit("getAllData", this.props.provider.providerId);
        });

        this.state.socket.on("sendAllData", data => {
            console.log(data);
        });

        this.openDirectory = this.openDirectory.bind(this);
    }

    componentDidMount() {
        this.state.socket.emit("connectToProvider", this.props.provider.providerId);

        this.state.socket.on("receiveData", metadata => {
            console.log(metadata);
            this.setState({
                files: this.state.files.concat([metadata])
            });
        });
    }

    openDirectory(name) {
        this.setState({
            files: []
        });
        this.state.socket.emit("opendirClient", name);
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
                                <button onClick={this.openDirectory}>Open directory</button>
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