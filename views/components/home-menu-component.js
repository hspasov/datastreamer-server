import path from "path";
import React from "react";
import { connect } from "react-redux";
import { Icon, Menu, Search } from "semantic-ui-react";
import { toggleSidebar } from "../../store/actions/sidebar";
import { removeImage } from "../../store/actions/image-viewer";
import { closeEditMode, removeText } from "../../store/actions/text-viewer";
import { navigateBack } from "../../store/actions/navigation";
import { openEditMode } from "../../store/actions/text-viewer";
import NavigationComponent from "./navigation-component";

class HomeMenu extends React.Component {
    constructor(props) {
        super(props);

        this.resolveBackButtonOnClick = this.resolveBackButtonOnClick.bind(this);
        this.resolveNavigate = this.resolveNavigate.bind(this);
        this.resolveNavigateBack = this.resolveNavigateBack.bind(this);
    }

    resolveBackButtonOnClick() {
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
        this.props.executeNavigate(directoryName);
    }

    render() {
        const menuColor = (this.props.provider.token && !this.props.dimmer.error.show) ? "green" : "red";

        const logo = <Menu.Item onClick={() => this.props.dispatch(toggleSidebar())} as="a" header active={this.props.sidebar.visible}>
            <Icon name="list layout" />
            DataStreamer
        </Menu.Item>;

        return <Menu color={menuColor} inverted fluid size="massive" fixed="top">
            {logo}
            <NavigationComponent navigateBack={(uid) => this.resolveNavigate(uid)} />
            <Menu.Item fitted position="right">
                <Search size="mini" />
            </Menu.Item>
            {this.props.textViewer.show && !this.props.textViewer.editMode &&
                <Menu.Item onClick={() => this.props.dispatch(openEditMode())}>
                    <Icon name="edit" /> Edit
                </Menu.Item>
            }
            {this.props.selection.selected.length > 0 && <Menu.Menu>
                <Menu.Item onClick={() => this.props.copyFiles()}>
                    <Icon name="copy"/> Copy here
                </Menu.Item>
                <Menu.Item onClick={() => this.props.moveFiles()}>
                    <Icon name="move" /> Move here
                </Menu.Item>
                <Menu.Item onClick={() => this.props.deleteFiles()}>
                    <Icon name="delete" /> Delete all
                </Menu.Item>
                </Menu.Menu>
            }
            <Menu.Item
                disabled={
                    !this.props.imageViewer.show &&
                    !this.props.textViewer.show &&
                    this.props.navigation.path.length === 0
                }
                onClick={this.resolveBackButtonOnClick()}>
                Close
            </Menu.Item>
        </Menu>;
    }
}

const HomeMenuComponent = connect(store => {
    return {
        provider: store.provider,
        dimmer: store.dimmer,
        sidebar: store.sidebar,
        imageViewer: store.imageViewer,
        textViewer: store.textViewer,
        navigation: store.navigation,
        selection: store.selection
    };
})(HomeMenu);

export default HomeMenuComponent;