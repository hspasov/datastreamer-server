import React from "react";
import { connect } from "react-redux";
import { Icon, Menu } from "semantic-ui-react";

class SelectOptions extends React.Component {
    render() {
        return (this.props.selection.selected.length > 0) ?
            <Menu.Menu position="right">
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
            </Menu.Menu> : null;
    }
}

const SelectOptionsComponent = connect(store => {
    return {
        selection: store.selection
    };
})(SelectOptions);

export default SelectOptionsComponent;