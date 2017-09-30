import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import path from "path";
import Files from "../../modules/files";
import RTC from "../../rtc_connection/client";

import File from "../components/file.component";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentDirectory: null,
            files: []
        };

        this.files = new Files();
        this.RTC = null;
        this.processMessage = this.processMessage.bind(this);
    }

    componentDidMount() {
        this.RTC = new RTC(this.files, this.props.provider.username, this.processMessage);
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
                    files: this.files.add(message.data)
                });
                break;
            case "addDir":
                this.setState({
                    files: this.files.addDir(message.data)
                });
                break;
            case "change":
                this.setState({
                    files: this.files.change(message.data)
                });
                break;
            case "unlink":
            case "unlinkDir":
                this.setState({
                    files: this.files.unlink(message.data)
                });
                break;
            case "sendFileMetadata":
                this.setState({
                    files: this.files.prepareDownload(message.data)
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
            files: this.files.clearFiles()
        });
        console.log("Opening directory", name);
        try {
            this.RTC.sendMessageChannel.send(JSON.stringify({
                action: "openDirectory",
                selectedDirectory: name
            }));
        } catch (e) {
            if (!this.RTC.sendMessageChannel) {
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
                                        <button onClick={this.RTC.addToDownloads.bind(this.RTC, file.path)}>Download file</button>
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

const setState = state => {
    HomePage.setState(state);
};

export {
    HomePage,
    setState
};