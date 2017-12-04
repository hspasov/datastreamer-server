import React from "react";
import FileSaver from "file-saver";
import { connect } from "react-redux";
import { Dimmer, Item, Loader, Segment } from "semantic-ui-react";
import RTC from "../../rtc_connection/client";
import File from "../components/file.component";
import path from "path";
import {
    add,
    addDir,
    change,
    unlink,
    prepareDownload,
    finishDownload,
    findFile
} from "../../modules/files";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isComponentUpdateAllowed: false,
            currentDirectory: null,
            files: []
        };

        this.onMessage = this.onMessage.bind(this);
        this.onChunk = this.onChunk.bind(this);
        this.RTC = new RTC(this.props.provider.token, this.onMessage, this.onChunk);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.isComponentUpdateAllowed;
    }

    openDirectory(name) {
        if (name === this.state.currentDirectory) {
            console.log("You are already in root directory!");
            return;
        }
        this.setState({
            isComponentUpdateAllowed: false,
            currentDirectory: name,
            files: []
        });
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

    onMessage(message) {
        switch (message.action) {
            case "sendCurrentDirectory":
                this.setState({
                    currentDirectory: message.data.path,
                    files: []
                });
                break;
            case "add":
                this.setState(prevState => ({
                    files: add(prevState.files, message.data)
                }));
                break;
            case "addDir":
                this.setState(prevState => ({
                    files: addDir(prevState.files, message.data)
                }));
                break;
            case "change":
                this.setState(prevState => ({
                    files: change(prevState.files, message.data)
                }));
                break;
            case "unlink":
            case "unlinkDir":
                this.setState(prevState => ({
                    files: unlink(prevState.files, message.data)
                }));
                break;
            case "sendFileMetadata":
                this.setState(prevState => ({
                    files: prepareDownload(prevState.files, message.data)
                }));
                break;
            case "doneSending":
                this.setState({ isComponentUpdateAllowed: true });
                break;
            case "message":
                console.log("There is a message!", message.message);
                break;
        }
    }

    onChunk(chunk) {
        this.RTC.receiveBuffer.push(chunk);
        this.RTC.receivedBytes += chunk.byteLength;
        if (this.RTC.receivedBytes === this.RTC.fileSize) {
            console.log("end of file");
            const file = finishDownload(this.state.files, { path: this.RTC.downloads[0] });
            const received = new Blob(this.RTC.receiveBuffer, file.mime);
            FileSaver.saveAs(received, path.basename(file.path));
            this.RTC.receiveBuffer = [];
            this.RTC.receivedBytes = 0;
            this.RTC.fileSize = 0;
            this.RTC.downloads.shift();
            if (this.RTC.downloads.length === 1) {
                const filePath = this.RTC.downloads[0];
                const file = findFile(this.state.files, filePath);
                this.downloadFile(file);
            }
        } else {
            console.log(`${this.RTC.receivedBytes}/${this.RTC.fileSize}`);
        }
    }

    downloadFile(file) {
        try {
            this.RTC.fileSize = file.size;
            this.RTC.sendMessageChannel.send(JSON.stringify({
                action: "downloadFile",
                filePath: file.path
            }));
        } catch (e) {
            if (!this.RTC.sendMessageChannel) {
                console.log("Can't finish task. Connection to provider lost.");
            } else {
                throw e;
            }
        }
    }

    addToDownloads(filePath) {
        this.RTC.downloads.push(filePath);
        if (this.RTC.downloads.length === 1) {
            const filePath = this.RTC.downloads[0];
            const file = findFile(this.state.files, filePath);
            this.downloadFile(file);
        }
    }

    render() {
        if (!this.props.client.token) {
            return (
                <p>Please login or register</p>
            );
        }
        return (
            <div>
                <Dimmer active={!this.state.isComponentUpdateAllowed}>
                    <Loader>Getting files...</Loader>
                </Dimmer>
                    {this.state.currentDirectory &&
                    <button
                        disabled={path.dirname(this.state.currentDirectory) === this.state.currentDirectory}
                        onClick={this.openDirectory.bind(this, path.dirname(this.state.currentDirectory))}>
                        Go back
                    </button>
                }
                    <Item.Group divided>
                    {this.state.files.map((file, i) => {
                        return (
                                <Item key={file.path}>
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
                                </Item>
                            )
                        })}
                </Item.Group>
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