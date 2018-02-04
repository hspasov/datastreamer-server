import path from "path";
import React from "react";
import { connect } from "react-redux";
import { Icon, Input, Label, Menu, Search } from "semantic-ui-react";
import { toggleSidebar } from "../../store/actions/sidebar";
import { removeImage } from "../../store/actions/image-viewer";
import { closeEditMode, removeText } from "../../store/actions/text-viewer";
import { navigateBack } from "../../store/actions/navigation";
import { openEditMode } from "../../store/actions/text-viewer";
import NavigationComponent from "./navigation-component";

class HomeMenu extends React.Component {
    constructor(props) {
        super(props);
    }

    resolveBackButtonOnClick() {
        if (this.props.imageViewer.show) {
            return () => this.props.removeImage();
        } else if (this.props.textViewer.show) {
            if (this.props.textViewer.editMode) {
                return () => this.props.closeEditMode();
            } else {
                return () => this.props.removeText();
            }
        } else {
            return () => this.props.navigateBack(this.props.navigation.path.length - 1);
        }
    }

    render() {
        const menuColor = (this.props.provider.token && !this.props.dimmer.error.show) ? "green" : "red";

        const logo = <Menu.Item onClick={() => this.props.toggleSidebar()} as="a" header active={this.props.sidebar.visible}>
            <Icon name="list layout" />
            DataStreamer
        </Menu.Item>;

        return <Menu color={menuColor} inverted fluid size="massive" fixed="top">
            {logo}
            <NavigationComponent navigateBack={index => this.props.navigateBack(index)} />
            {this.props.textViewer.show && !this.props.textViewer.editMode &&
                <Menu.Item onClick={() => this.props.openEditMode()}>
                    <Icon name="edit" /> Edit
                </Menu.Item>
            }
            <Menu.Item
                disabled={
                    !this.props.imageViewer.show &&
                    !this.props.textViewer.show &&
                    this.props.navigation.path.length === 0
                }
                onClick={this.resolveBackButtonOnClick()}>
                <Icon size="large" name="arrow left" />Go back
                    </Menu.Item>
            {this.props.selection.selected.length > 0 ? <Menu.Menu position="right">
                    <Menu.Item onClick={() => this.props.showSelected()}>
                        <Icon name="file" />{this.props.selection.selected.length} selected
                    </Menu.Item>
                    <Menu.Item onClick={() => this.props.copyFiles()}>
                        <Icon name="copy" /> Copy here
                    </Menu.Item>
                    <Menu.Item onClick={() => this.props.moveFiles()}>
                        <Icon name="move" /> Move here
                    </Menu.Item>
                    <Menu.Item onClick={() => this.props.deleteFiles()}>
                        <Icon name="trash" /> Delete all
                    </Menu.Item>
                    <Menu.Item onClick={() => this.props.clearSelection()}>
                        <Icon name="cancel" /> Cancel
                    </Menu.Item>
                </Menu.Menu>
                :
                <Menu.Menu position="right">
                    <Menu.Item>
                        <label>
                            <Input type="file" style={{ display: "none" }} onChange={this.props.handleUploadFiles} />
                            <Icon size="large" name="plus" />Upload file
                         </label>
                    </Menu.Item>
                </Menu.Menu>
            }
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
}, {
    removeImage,
    openEditMode,
    closeEditMode,
    removeText,
    toggleSidebar,
})(HomeMenu);

export default HomeMenuComponent;