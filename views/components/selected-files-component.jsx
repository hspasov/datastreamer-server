import React from "react";
import { connect } from "react-redux";
import { Button, Dimmer, Icon, Message } from "semantic-ui-react";
import { hideSelected, removeFromSelected } from "../../store/actions/selection";

class SelectedFiles extends React.Component {
    render() {
        return (this.props.selection.show) ?
            <Dimmer active={this.props.selection.show} page onClickOutside={() => this.props.hideSelected()}>
                <Message compact>
                    <Message.List>
                        <Message.Header>Selected files</Message.Header>
                        {this.props.selection.selected.map((file, index) => {
                            return <Message.Item key={`selected:${file.path}`}>
                                {file.path}
                                <Button floated="right" color="red" onClick={() => this.props.removeFromSelected(file.path)}><Icon name="remove" />Unselect</Button>
                            </Message.Item>
                        })}
                    </Message.List>
                </Message>
            </Dimmer> : null;
    }
}

const SelectedFilesComponent = connect(store => {
    return {
        selection: store.selection
    };
}, {
    hideSelected,
    removeFromSelected
})(SelectedFiles);

export default SelectedFilesComponent;