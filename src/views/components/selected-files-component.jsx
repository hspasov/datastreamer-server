import React from "react";
import { connect } from "react-redux";
import { Button, Dimmer, Grid, Icon, Message } from "semantic-ui-react";
import { hideSelected, removeFromSelected } from "../../store/actions/selection";

class SelectedFiles extends React.Component {
    render() {
        return (this.props.selection.show) ?
            <Dimmer active={this.props.selection.show} page onClickOutside={() => this.props.hideSelected()}>
                <Message compact>
                    <Message.Header>Selected files</Message.Header>
                    <Grid>
                        {this.props.selection.selected.map((file, index) => {
                            return <Grid.Row columns={2} key={`selected:${file.path}` }>
                                <Grid.Column>{file.path}
                                </Grid.Column>
                                <Grid.Column>
                                    <Button size="mini" floated="right" color="red" onClick={() => this.props.removeFromSelected(file.path)}><Icon name="remove" />Unselect</Button>
                                </Grid.Column>
                            </Grid.Row>
                        })}
                    </Grid>
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