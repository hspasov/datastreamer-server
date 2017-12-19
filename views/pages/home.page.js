import React from "react";
import FileSaver from "file-saver";
import { connect } from "react-redux";
import { Redirect } from "react-router";
import { Accordion, Breadcrumb, Button, Dimmer, Divider, Header, Icon, Image, Item, Loader, Menu, Message, Segment } from "semantic-ui-react";
import RTC from "../../rtc_connection/client";
import path from "path";
import { findFile } from "../../modules/files";
import Thumbnail from "../components/thumbnail.component";
import { toggleErrorMore, setError, removeError, setLoaderMessage } from "../../store/actions/dimmer";
import {
    addFile,
    addDir,
    change,
    unlink,
    setThumbnail,
    prepareDownload,
    finishDownload,
    clearFiles,
} from "../../store/actions/files";
import { toggleSidebar } from "../../store/actions/sidebar";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isComponentUpdateAllowed: true,
            currentDirectory: "",
        };

        this.downloadFile = this.downloadFile.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onChunk = this.onChunk.bind(this);
        this.errorHandler = this.errorHandler.bind(this);
        this.toggleErrorMessageMore = this.toggleErrorMessageMore.bind(this);
        this.replaceDefaultIcon = this.replaceDefaultIcon.bind(this);
        this.getThumbnail = this.getThumbnail.bind(this);
        this.toggleSidebar = this.toggleSidebar.bind(this);
        this.RTC = new RTC(this.props.provider.token, this.onMessage, this.onChunk, this.errorHandler);
    }

    componentWillMount() {
        this.props.dispatch(clearFiles());
        this.props.dispatch(setLoaderMessage("Connecting to provider..."));
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
        });
        this.props.dispatch(clearFiles());
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
                });
                this.props.dispatch(clearFiles());
                break;
            case "sendThumbnailSize":
                this.RTC.fileSize = message.data;
                this.RTC.sendMessageChannel.send(JSON.stringify({
                    action: "readyForThumbnail"
                }));
                break;
            case "add":
                this.props.dispatch(addFile(message.data));
                this.replaceDefaultIcon(message.data);
                break;
            case "addDir":
                this.props.dispatch(addDir(message.data));
                break;
            case "change":
                this.props.dispatch(change(message.data));
                break;
            case "unlink":
            case "unlinkDir":
                this.props.dispatch(unlink(message.data));
                break;
            case "doneSending":
                this.props.dispatch(removeError());
                this.setState({ isComponentUpdateAllowed: true });
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
            const file = findFile(this.props.files.files, this.RTC.downloads[0].path);
            const received = new Blob(this.RTC.receiveBuffer, { type: file.mime });
            switch(this.RTC.downloads[0].context) {
                case "download":
                    this.props.dispatch(finishDownload(file));
                    FileSaver.saveAs(received, path.basename(file.path));
                    break;

                case "thumbnail":
                    const imageURL = window.URL.createObjectURL(received);
                    console.log(imageURL);
                    console.log(file.path);
                    this.props.dispatch(setThumbnail(file.path, imageURL));
                    break;
            }
            this.RTC.receiveBuffer = [];
            this.RTC.receivedBytes = 0;
            this.RTC.fileSize = 0;
            this.RTC.downloads.shift();
            if (this.RTC.downloads.length >= 1) {
                const download = this.RTC.downloads[0];
                const file = findFile(this.props.files.files, download.path);
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
                    this.props.dispatch(prepareDownload(file));
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
            const file = findFile(this.props.files.files, download.path);
            console.log(file);
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
        this.props.dispatch(toggleErrorMore());
    }

    errorHandler(error) {
        switch (error.type) {
            case "generic":
                this.props.dispatch(setError("Something went wrong.", error.message));
                break;
            case "connection":
                this.props.dispatch(setError("Connection failure.", error.message));
                break;
            case "invalidToken":
                this.props.dispatch(setError("Authentication failed.", error.message));
                break;
            case "sessionExpired":
                this.props.dispatch(setError("Session expired.", error.message));
                break;
        }
        this.setState({
            isComponentUpdateAllowed: true
        });
        console.log(error);
    }

    toggleSidebar() {
        this.props.dispatch(toggleSidebar());
    }

    render() {
        if (!this.props.client.token) {
            return <Redirect to="/login"></Redirect>;
        }
        if (!this.props.provider.token) {
            return <Redirect to="/connect"></Redirect>;
        }

        const menuColor = (this.props.client.token) ?
            (this.props.provider.token && !this.props.dimmer.error.show) ? "green" : "red" :
            "blue";

        const logo = <Menu.Item onClick={this.toggleSidebar} as='a' header active={this.props.sidebar.visible}>
                <Icon name="list layout" />
                DataStreamer
            </Menu.Item>;

        return (
            <div>
                <Menu color={menuColor} inverted fluid size="massive" fixed="top">
                    {logo}
                    <Menu.Item as={Breadcrumb}>
                        <Breadcrumb.Section link>{this.props.provider.username}</Breadcrumb.Section>
                        {this.props.navigation.path.map((directory, i) => {
                            return <div>
                                <Breadcrumb.Divider />
                                <Breadcrumb.Section link>{directory}</Breadcrumb.Section>
                            </div>;
                        })
                        }</Menu.Item>
                </Menu>
                <Dimmer active={this.props.dimmer.show}>
                    <Loader disabled={this.props.dimmer.error.show}>{this.props.dimmer.loaderMessage}</Loader>
                    <Message negative hidden={!this.props.dimmer.error.show}>
                        <Message.Header>{this.props.dimmer.error.message}</Message.Header>
                        <Accordion>
                            <Accordion.Title onClick={this.toggleErrorMessageMore}>
                                <Icon name="dropdown" />
                                More information
                            </Accordion.Title>
                            <Accordion.Content active={this.props.dimmer.error.more.show}>
                                <p>{this.props.dimmer.error.more.message}</p>
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
                    {this.props.files.files.map((file, i) => {
                        return (
                            <Item key={file.path}>
                                <Item.Content>
                                    <Thumbnail
                                        mime={file.mime}
                                        thumbnail={file.imageURL}
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
        provider: store.provider,
        dimmer: store.dimmer,
        sidebar: store.sidebar,
        navigation: store.navigation,
        files: store.files
    };
})(Home);

export default HomePage;