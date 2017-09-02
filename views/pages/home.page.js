import React from "react";
import ReactDOM from "react-dom";
import io from "socket.io-client";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            socket: io("http://localhost:3000")
        };
    }

    componentDidMount() {
        console.log("here");
        console.log(this.state.socket);
        this.state.socket.on("render", (msg, metadata) => {
            console.log(metadata);
            this.refs.render.innerHTML = msg;
        });
    }

    render() {
        console.log("renders");
        return (
            <div>
                <div ref="render">Hell World!</div>
            </div>
        );
    }
}

module.exports = Home;