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
            socket: io("http://localhost:3000")
        };

        this.openDirectory = this.openDirectory.bind(this);
    }

    componentDidMount() {
        this.state.socket.on("render", (msg, metadata) => {
            console.log(metadata);
            this.refs.render.innerHTML = msg;
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
        client: store.client
    };
})(Home);

export default HomePage;