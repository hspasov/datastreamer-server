import React from "react";
import FileSaver from "file-saver";
import { connect } from "react-redux";
import { Redirect } from "react-router";
import {
    Breadcrumb, Button, Container, Divider, Form,
    Header, Icon, Image, Item, Loader, Menu, Message,
    Progress, Reveal, Search, Segment
} from "semantic-ui-react";
import RTC from "../../rtc_connection/client";
import path from "path";
import uniqid from "uniqid";
import { findFile } from "../../modules/files";
import Thumbnail from "../components/thumbnail";
import DimmerComponent from "../components/dimmer-component";
import NavigationComponent from "../components/navigation-component";
import File from "../components/file";
import { setError, removeError, setLoaderMessage, deactivateDimmer } from "../../store/actions/dimmer";
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
import { setImage, removeImage } from "../../store/actions/image-viewer";
import { removeText, setText, editText, closeEditMode, openEditMode } from "../../store/actions/text-viewer";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isComponentUpdateAllowed: true,
            downloadPercent: 0
        };

        this.addToDownloads = this.addToDownloads.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.messageHandler = this.messageHandler.bind(this);
        this.chunkHandler = this.chunkHandler.bind(this);
        this.errorHandler = this.errorHandler.bind(this);
        this.resolveNavigate = this.resolveNavigate.bind(this);
        this.resolveNavigateBack = this.resolveNavigateBack.bind(this);
        this.executeNavigate = this.executeNavigate.bind(this);
        this.navigate = this.navigate.bind(this);
        this.RTC = new RTC({
            connectionToken: this.props.provider.token,
            writeAccess: this.props.provider.writeAccess
        }, {
            handleMessage: this.messageHandler,
            handleChunk: this.chunkHandler,
            errorHandler: this.errorHandler
        });
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
        this.resolveNavigateBack(parentDirectories - elementIndex - 1);
    }

    resolveNavigateBack(steps) {
        console.log(steps);
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
        this.executeNavigate(directoryPath);
    }

    executeNavigate(directoryPath) {
        console.log("execute navigate:", directoryPath);
        this.props.dispatch(clearFiles());
        this.RTC.sendMessage("openDirectory", directoryPath);
    }

    messageHandler (message) {
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
                this.RTC.sendMessage("readyForThumbnail");
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

    chunkHandler(chunk) {
        this.RTC.receiveBuffer.push(chunk);
        this.RTC.receivedBytes += chunk.byteLength;
        console.log(chunk.byteLength);
        const percent = (this.RTC.receivedBytes / this.RTC.fileSize) * 100;
        if (percent - this.state.downloadPercent > 10) {
            this.setState({
                downloadPercent: percent
            });
        }
        if (this.RTC.receivedBytes >= this.RTC.fileSize) {
            console.log("end of file");
            this.setState({
                downloadPercent: 0
            });
            const file = findFile(this.props.files.files, this.RTC.downloads[0].path);
            const received = new Blob(this.RTC.receiveBuffer, { type: file.mime });
            switch(this.RTC.downloads[0].context) {
                case "download":
                    this.props.dispatch(finishDownload(file));
                    FileSaver.saveAs(received, path.basename(file.path));
                    break;
                case "thumbnail":
                    this.props.dispatch(setThumbnail(file.path, window.URL.createObjectURL(received)));
                    break;
                case "image":
                    this.props.dispatch(setImage(window.URL.createObjectURL(received)));
                    break;
                case "text":
                    let result = "";
                    const decoder = new TextDecoder();
                    for (let i = 0; i < this.RTC.receiveBuffer.length; i++) {
                        result += decoder.decode(this.RTC.receiveBuffer[i]);
                    }
                    this.props.dispatch(setText(result));
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

        }
    }

    downloadFile(file, context) {
        switch(context) {
            case "download":
                this.RTC.fileSize = file.size;
                this.props.dispatch(prepareDownload(file));
                this.RTC.sendMessage("downloadFile", file.path);
                break;
            case "thumbnail":
                this.RTC.sendMessage("getThumbnail", file.path);
                break;
            case "image":
                this.RTC.fileSize = file.size;
                this.RTC.sendMessage("getImage", file.path);
                break;
            case "text":
                this.RTC.fileSize = file.size;
                this.RTC.sendMessage("getText", file.path);
                break;
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
            onClick={() => this.resolveNavigateBack(1)}>
            Go back
        </Menu.Item>

        const resolveBackButtonOnClick = () => {
            if (this.props.imageViewer.show) {
                return () => this.props.dispatch(removeImage());
            } else if (this.props.textViewer.show) {
                if (this.props.textViewer.editMode) {
                    return () => this.props.dispatch(closeEditMode());
                } else {
                    return () => this.props.dispatch(removeText());
                }
            } else {
                return () => this.resolveNavigateBack(1);
            }
        }
        const disabled = this.props.navigation.path.length === 0;

        const files = <Item.Group divided>
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
                    openImage={() => this.addToDownloads(file.path, "image")}
                    openText={() => this.addToDownloads(file.path, "text")}
                    getThumbnail={() => this.addToDownloads(file.path, "thumbnail")}
                    downloadStatus={(file.type !== "directory") ? file.download.status : null}
                    addToDownloads={() => this.addToDownloads(file.path, "download")}
                    downloadPercent={(this.RTC.downloads.length > 0 && this.RTC.downloads[0].path === file.path) ? this.state.downloadPercent : 0}
                />
            })}
        </Item.Group>;

        const imageViewer = <div>
            <Image src={this.props.imageViewer.imageURL}/>
        </div>;

        const textViewerNormalMode = <pre>{this.props.textViewer.text}</pre>;
        const textViewerEditMode = <Form>
            <Form.TextArea onChange={event => this.props.dispatch(editText(event.target.value))} value={this.props.textViewer.editedText} />
        </Form>;

        const textViewer = <Container>
            {
                (this.props.textViewer.editMode) ?
                    textViewerEditMode : textViewerNormalMode
            }
        </Container>;

        return <div>
            <Menu color={menuColor} inverted fluid size="massive" fixed="top">
                {logo}
                <NavigationComponent navigateBack={(uid) => this.resolveNavigate(uid)} />
                <Menu.Item fitted position="right">
                    <Reveal animated="fade">
                        <Reveal.Content visible>
                            <p>
                                Search
                            </p>
                        </Reveal.Content>
                        <Reveal.Content visible={false}>
                            <Search size="mini" />
                        </Reveal.Content>
                    </Reveal>
                </Menu.Item>
                {this.props.textViewer.show && !this.props.textViewer.editMode &&
                    <Menu.Item onClick={() => this.props.dispatch(openEditMode())}>
                        <Icon name="edit"/> Edit
                    </Menu.Item>
                }
                <Menu.Item
                    disabled={
                        !this.props.imageViewer.show &&
                        !this.props.textViewer.show &&
                        this.props.navigation.path.length === 0
                    }
                    onClick={resolveBackButtonOnClick()}>
                    Close
                </Menu.Item>
            </Menu>
            <Segment padded="very" attached="top" color="grey">
                <DimmerComponent />
                {(this.props.imageViewer.show)? imageViewer : (this.props.textViewer.show) ? textViewer : files}
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
        files: store.files,
        imageViewer: store.imageViewer,
        textViewer: store.textViewer,
        fileProperties: store.fileProperties
    };
})(Home);

export default HomePage;