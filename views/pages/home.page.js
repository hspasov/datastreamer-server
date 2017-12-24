import React from "react";
import FileSaver from "file-saver";
import { connect } from "react-redux";
import { Redirect } from "react-router";
import {
    Breadcrumb, Button, Divider,
    Header, Icon, Image, Item, Loader, Menu, Message,
    Progress, Segment
} from "semantic-ui-react";
import RTC from "../../rtc_connection/client";
import path from "path";
import uniqid from "uniqid";
import { findFile } from "../../modules/files";
import Thumbnail from "../components/thumbnail.component";
import DimmerComponent from "../components/dimmer-component";
import NavigationComponent from "../components/navigation-component";
import File from "../components/file";
import { toggleErrorMore, setError, removeError, setLoaderMessage, deactivateDimmer } from "../../store/actions/dimmer";
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
import {
    openDirectory,
    navigateBack,
    changePath,
    clearPath
} from "../../store/actions/navigation";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isComponentUpdateAllowed: true
        };

        this.addToDownloads = this.addToDownloads.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onChunk = this.onChunk.bind(this);
        this.errorHandler = this.errorHandler.bind(this);
        this.resolveNavigate = this.resolveNavigate.bind(this);
        this.resolveNavigateBack = this.resolveNavigateBack.bind(this);
        this.executeNavigate = this.executeNavigate.bind(this);
        this.navigate = this.navigate.bind(this);
        this.RTC = new RTC(this.props.provider.token, this.onMessage, this.onChunk, this.errorHandler);
    }

    componentWillMount() {
        this.props.dispatch(clearFiles());
        this.props.dispatch(clearPath());
        this.props.dispatch(setLoaderMessage("Connecting to provider..."));
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.isComponentUpdateAllowed;
    }

    componentWillUnmount() {
        this.RTC.socket.disconnect();
    }

    resolveNavigate(uid) {
        const parentDirectories = this.props.navigation.path.length;
        const elementIndex = this.props.navigation.path.findIndex(e => e.uid === uid);
        this.resolveNavigateBack(parentDirectories - elementIndex);
    }

    resolveNavigateBack(steps) {
        const parentDirectories = this.props.navigation.path.length;
        if (parentDirectories === 0) {
            console.log("You are already in root directory!");
            return;
        }
        this.props.dispatch(navigateBack(parentDirectories - steps));
        const directoryName = path.join(...this.props.navigation.path.slice(0, parentDirectories - steps).map(dir => dir.name));
        this.executeNavigate(directoryName);
    }

    navigate(directoryPath) {
        const directoryName = path.basename(directoryPath);
        this.props.dispatch(openDirectory({
            name: directoryName,
            uid: uniqid()
        }));
        this.executeNavigate(directoryName);
    }

    executeNavigate(directoryPath) {
        this.props.dispatch(clearFiles());
        try {
            this.RTC.sendMessageChannel.send(JSON.stringify({
                action: "openDirectory",
                selectedDirectory: directoryPath
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
                console.log(`files to download: ${this.RTC.downloads.length}`);
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

    render() {
        if (!this.props.client.token) {
            return <Redirect to="/login"></Redirect>;
        }
        if (!this.props.provider.token) {
            return <Redirect to="/connect"></Redirect>;
        }

        const menuColor = (this.props.provider.token && !this.props.dimmer.error.show) ? "green" : "red";

        const logo = <Menu.Item onClick={() => this.props.dispatch(toggleSidebar())} as='a' header active={this.props.sidebar.visible}>
            <Icon name="list layout" />
            DataStreamer
        </Menu.Item>;

        const goBack = <Menu.Item as="a" position="right"
            disabled={this.props.navigation.path.length === 0}
            onClick={() => this.resolveNavigateBack(1)}>
            Go back
        </Menu.Item>

        return <div>
            <Menu color={menuColor} inverted fluid size="massive" fixed="top">
                {logo}
                <NavigationComponent navigateBack={(uid) => this.resolveNavigate(uid)}/>
                {goBack}
            </Menu>
            <Segment padded attached="top">
                <DimmerComponent/>
                <Item.Group divided>
                {this.props.files.files.map((file, i) => {
                    return <File
                        key={file.path}
                        name={file.name}
                        type={file.type}
                        size={file.size}
                        access={file.access}
                        path={file.path}
                        mime={file.mime}
                        imageURL={file.imageURL}
                        openDirectory={() => this.navigate(file.path)}
                        getThumbnail={() => this.addToDownloads(file.path, "thumbnail")}
                        downloadStatus={(file.type !== "directory")? file.download.status : null}
                        addToDownloads={() => this.addToDownloads(file.path, "download")}
                    />
                    })}
                </Item.Group>
            </Segment>
        </div>;
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