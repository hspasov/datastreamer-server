import React from "react";
import FileSaver from "file-saver";
import { connect } from "react-redux";
import { Redirect } from "react-router";
import { Accordion, Button, Dimmer, Header, Icon, Image, Item, Loader, Message, Segment } from "semantic-ui-react";
import RTC from "../../rtc_connection/client";
import path from "path";
import {
    add,
    addDir,
    change,
    unlink,
    prepareDownload,
    finishDownload,
    setThumbnail,
    findFile
} from "../../modules/files";
import Thumbnail from "../components/thumbnail.component";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isComponentUpdateAllowed: true,
            isDimmerActive: true,
            loaderMessage: "Connecting to provider...",
            currentDirectory: null,
            showError: false,
            showErrorMessageMore: false,
            errorMessage: "",
            errorMessageMore: "",
            files: []
        };

        this.downloadFile = this.downloadFile.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onChunk = this.onChunk.bind(this);
        this.errorHandler = this.errorHandler.bind(this);
        this.toggleErrorMessageMore = this.toggleErrorMessageMore.bind(this);
        this.replaceDefaultIcon = this.replaceDefaultIcon.bind(this);
        this.getThumbnail = this.getThumbnail.bind(this);
        this.RTC = new RTC(this.props.provider.token, this.onMessage, this.onChunk, this.errorHandler);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.isComponentUpdateAllowed;
    }

    componentWillUnmount() {
        this.RTC.socket.disconnect();
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
        try {
            this.RTC.sendMessageChannel.send(JSON.stringify({
                action: "openDirectory",
                selectedDirectory: name
            }));
        } catch (error) {
            if (!this.RTC.sendMessageChannel) {
                this.errorHandler({
                    type: "connection",
                    message: "Connection to provider failed."
                });
            } else {
                this.errorHandler({
                    type: "generic",
                    message: error
                });
            }
        }
    }

    onMessage(message) {
        switch (message.action) {
            case "sendCurrentDirectory":
                this.setState({
                    isComponentUpdateAllowed: false,
                    currentDirectory: message.data.path,
                    files: []
                });
                break;
            case "sendThumbnailSize":
                this.RTC.fileSize = message.data;
                this.RTC.sendMessageChannel.send(JSON.stringify({
                    action: "readyForThumbnail"
                }));
                break;
            case "add":
                this.setState(prevState => ({
                    files: add(prevState.files, message.data)
                }));
                this.replaceDefaultIcon(message.data);
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
            case "doneSending":
                this.setState({ isDimmerActive: false, isComponentUpdateAllowed: true, showError: false });
                break;
            case "connectSuccess":
                console.log("Connect success!");
                break;
        }
    }

    onChunk(chunk) {
        this.RTC.receiveBuffer.push(chunk);
        this.RTC.receivedBytes += chunk.byteLength;
        if (this.RTC.receivedBytes === this.RTC.fileSize) {
            console.log("end of file");
            const file = findFile(this.state.files, this.RTC.downloads[0].path);
            const received = new Blob(this.RTC.receiveBuffer, { type: file.mime });
            switch(this.RTC.downloads[0].context) {
                case "download":
                    this.setState(prevState => ({
                        files: finishDownload(this.state.files, file.path)
                    }));
                    FileSaver.saveAs(received, path.basename(file.path));
                    break;

                case "thumbnail":
                    const imageURL = window.URL.createObjectURL(received);
                    console.log(imageURL);
                    console.log(file.path);
                    console.log(setThumbnail(this.state.files, file.path, imageURL));
                    this.setState(prevState => ({
                        files: setThumbnail(this.state.files, file.path, imageURL)
                    }));
                    break;
            }
            this.RTC.receiveBuffer = [];
            this.RTC.receivedBytes = 0;
            this.RTC.fileSize = 0;
            this.RTC.downloads.shift();
            if (this.RTC.downloads.length >= 1) {
                const download = this.RTC.downloads[0];
                const file = findFile(this.state.files, download.path);
                console.log(`i'm actually here, length is ${this.RTC.downloads.length}`);
                console.log(file);
                this.downloadFile(file, download.context);
            } else {
                console.log(`cant download more, length is ${this.RTC.downloads.length}`);
            }
        } else {
            console.log(`${this.RTC.receivedBytes}/${this.RTC.fileSize}`);
        }
    }

    downloadFile(file, context) {
        try {
            switch(context) {
                case "download":
                    this.RTC.fileSize = file.size;
                    this.setState(prevState => ({
                        files: prepareDownload(prevState.files, file)
                    }));
                    this.RTC.sendMessageChannel.send(JSON.stringify({
                        action: "downloadFile",
                        filePath: file.path
                    }));
                    break;
                case "thumbnail":
                    this.RTC.sendMessageChannel.send(JSON.stringify({
                        action: "getThumbnail",
                        filePath: file.path
                    }));
                    break;
            }
        } catch (error) {
            if (!this.RTC.sendMessageChannel) {
                this.errorHandler({
                    type: "connection",
                    message: "Connection to provider failed."
                });
            } else {
                this.errorHandler({
                    type: "generic",
                    message: error
                });
            }
        }
    }

    addToDownloads(filePath, context) {
        this.RTC.downloads.push({ path: filePath, context });
        console.log(`added to downlads, length is ${this.RTC.downloads.length}`);
        if (this.RTC.downloads.length === 1) {
            const download = this.RTC.downloads[0];
            console.log(download);
            const file = findFile(this.state.files, download.path);
            this.downloadFile(file, context);
        }
    }

    replaceDefaultIcon(file) {
        switch (file.mime) {
            case "image/jpeg":
            case "image/png":
                this.getThumbnail(file.path);
                break;
        }
    }

    getThumbnail(filePath) {
        this.addToDownloads.bind(this)(filePath, "thumbnail");
    }

    toggleErrorMessageMore() {
        this.setState(prevState => ({
            showErrorMessageMore: !(prevState.showErrorMessageMore)
        }));
    }

    errorHandler(error) {
        switch (error.type) {
            case "generic":
                this.setState({
                    errorMessage: "Something went wrong",
                    errorMessageMore: error.message
                });
                break;
            case "connection":
                this.setState({
                    errorMessage: "Connection failure",
                    errorMessageMore: error.message
                });
                break;
            case "invalidToken":
                this.setState({
                    errorMessage: "Authentication failed",
                    errorMessageMore: error.message
                });
                break;
            case "sessionExpired":
                this.setState({
                    errorMessage: "Session expired",
                    errorMessageMore: error.message
                });
                break;
        }
        this.setState({
            showError: true,
            isDimmerActive: true,
            isComponentUpdateAllowed: true
        });
        console.log(error);
    }

    render() {
        if (!this.props.client.token) {
            return <Redirect to="/login"></Redirect>;
        }
        if (!this.props.provider.token) {
            return <Redirect to="/connect"></Redirect>;
        }
        return (
            <div>
                <Dimmer active={this.state.isDimmerActive}>
                    <Loader disabled={this.state.showError}>{this.state.loaderMessage}</Loader>
                    <Message negative hidden={!this.state.showError}>
                        <Message.Header>{this.state.errorMessage}</Message.Header>
                        <Accordion>
                            <Accordion.Title onClick={this.toggleErrorMessageMore}>
                                <Icon name="dropdown" />
                                More information
                            </Accordion.Title>
                            <Accordion.Content active={this.state.showErrorMessageMore}>
                                <p>{this.state.errorMessageMore}</p>
                            </Accordion.Content>
                        </Accordion>
                    </Message>
                </Dimmer>
                    {this.state.currentDirectory &&
                    <Button
                        disabled={path.dirname(this.state.currentDirectory) === this.state.currentDirectory}
                        onClick={this.openDirectory.bind(this, path.dirname(this.state.currentDirectory))}>
                        Go back
                    </Button>
                }
                    <Item.Group divided>
                    {this.state.files.map((file, i) => {
                        return (
                            <Item key={file.path}>
                                <Item.Content>
                                    <Thumbnail
                                        mime={file.mime}
                                        thumbnail={file.thumbnail}
                                        onClick={this.addToDownloads.bind(this, file.path, "thumbnail")} />
                                    <Item.Header>{file.name}</Item.Header>
                                    <Item.Meta>Type: {file.type}</Item.Meta>
                                    <Item.Meta>Size: {file.size}</Item.Meta>
                                    <Item.Meta>Read access: {file.access.read.toString()}</Item.Meta>
                                    <Item.Meta>Write access: {file.access.write.toString()}</Item.Meta>
                                    <Item.Meta>Execute access: {file.access.execute.toString()}</Item.Meta>
                                    {
                                        (file.type == "directory") ?
                                            <Button onClick={this.openDirectory.bind(this, file.path)}>Open directory</Button> :
                                            <Button onClick={this.addToDownloads.bind(this, file.path, "download")}>Download file</Button>
                                    }
                                </Item.Content>
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