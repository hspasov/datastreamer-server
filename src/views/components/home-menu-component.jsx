import path from "path";
import React from "react";
import { connect } from "react-redux";
import { Icon, Input, Label, Menu, Search } from "semantic-ui-react";
import { removeImage } from "../../store/actions/image-viewer";
import { closeEditMode, removeText } from "../../store/actions/text-viewer";
import { navigateBack } from "../../store/actions/navigation";
import { openEditMode } from "../../store/actions/text-viewer";
import { sortFilesByNameAsc } from "../../store/actions/files";
import NavigationComponent from "./navigation-component.jsx";
import LogoComponent from "./logo-component.jsx";
import SelectOptionsComponent from "./select-options-component.jsx";

class HomeMenu extends React.Component {
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

        const textViewerButton = (this.props.textViewer.editMode) ?
            <Menu.Item onClick={() => this.props.saveText()}>
                <Icon name="save" /> Save
                </Menu.Item> : (this.props.provider.writeAccess) ?
            <Menu.Item onClick={() => this.props.openEditMode()}>
                <Icon name="edit" /> Edit
            </Menu.Item> : null;

        return <Menu color={menuColor} inverted fluid size="massive" fixed="top">
            <LogoComponent />
            <NavigationComponent navigateBack={index => this.props.navigateBack(index)} />
            {this.props.textViewer.show && textViewerButton}
            <Menu.Item
                disabled={
                    !this.props.imageViewer.show &&
                    !this.props.textViewer.show &&
                    this.props.navigation.path.length === 0
                }
                onClick={this.resolveBackButtonOnClick()}>
                <Icon size="large" name="arrow left" />
                Go back
            </Menu.Item>
            <Menu.Menu position="right">
                <SelectOptionsComponent
                    showSelected={this.props.showSelected}
                    copyFiles={this.props.copyFiles}
                    moveFiles={this.props.moveFiles}
                    deleteFiles={this.props.deleteFiles}
                    clearSelection={this.props.clearSelection}
                />
                <Menu.Item onClick={() => this.props.sortFilesByNameAsc()} link>
                    Sort by name
                </Menu.Item>
                {this.props.provider.writeAccess && <Menu.Item link>
                    <label>
                        <Input
                            type="file"
                            style={{ display: "none" }}
                            onChange={event => this.props.handleUploadFiles(event.target.files)}
                        />
                        <Icon size="large" name="plus" />Upload file
                    </label>
                </Menu.Item>}
            </Menu.Menu>
        </Menu>;
    }
}

const HomeMenuComponent = connect(store => {
    return {
        provider: store.provider,
        dimmer: store.dimmer,
        imageViewer: store.imageViewer,
        textViewer: store.textViewer,
        navigation: store.navigation
    };
}, {
    removeImage,
    openEditMode,
    closeEditMode,
    removeText,
    sortFilesByNameAsc
})(HomeMenu);

export default HomeMenuComponent;