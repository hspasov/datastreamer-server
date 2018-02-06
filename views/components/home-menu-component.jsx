import path from "path";
import React from "react";
import { connect } from "react-redux";
import { Icon, Input, Label, Menu, Search } from "semantic-ui-react";
import { removeImage } from "../../store/actions/image-viewer";
import { closeEditMode, removeText } from "../../store/actions/text-viewer";
import { navigateBack } from "../../store/actions/navigation";
import { openEditMode } from "../../store/actions/text-viewer";
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

        return <Menu color={menuColor} inverted fluid size="massive" fixed="top">
            <LogoComponent />
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
                <Icon size="large" name="arrow left" />
                Go back
            </Menu.Item>
            <SelectOptionsComponent
                showSelected={this.props.showSelected}
                copyFiles={this.props.copyFiles}
                moveFiles={this.props.moveFiles}
                deleteFiles={this.props.deleteFiles}
                clearSelection={this.props.clearSelection}
            />
            <Menu.Menu position="right">
                <Menu.Item>
                    <label>
                        <Input type="file" style={{ display: "none" }} onChange={this.props.handleUploadFiles} />
                        <Icon size="large" name="plus" />Upload file
                    </label>
                </Menu.Item>
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
    removeText
})(HomeMenu);

export default HomeMenuComponent;