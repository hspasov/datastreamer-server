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

        this.resolveBackButtonOnClick = this.resolveBackButtonOnClick.bind(this);
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
            return () => this.props.navigateBack(this.props.navigation.path.length - 1);
        }
    }

    render() {
        const menuColor = (this.props.provider.token && !this.props.dimmer.error.show) ? "green" : "red";

        const logo = <Menu.Item onClick={() => this.props.dispatch(toggleSidebar())} as="a" header active={this.props.sidebar.visible}>
            <Icon name="list layout" />
            DataStreamer
        </Menu.Item>;

        return <Menu color={menuColor} inverted fluid size="massive" fixed="top">
            {logo}
            <NavigationComponent navigateBack={index => this.props.navigateBack(index)} />
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
            <Menu.Item>
                <label>
                    <Input type="file" style={{ display: "none" }} onChange={this.props.handleInputChange} />
                    Add file
                </label>
            </Menu.Item>
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