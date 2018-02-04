import React from "react";
import { connect } from "react-redux";
import { Accordion, Dimmer, Icon, Loader, Message } from "semantic-ui-react";
import { toggleErrorMore, deactivateDimmer } from "../../store/actions/dimmer";

class DimmerComponent extends React.Component {
    render() {
        return <Dimmer
            active={this.props.dimmer.show}
            onClickOutside={() => this.props.dimmer.dismissible && this.props.deactivateDimmer()}
            page>
            <Loader disabled={this.props.dimmer.error.show}>{this.props.dimmer.loaderMessage}</Loader>
            <Message negative hidden={!this.props.dimmer.error.show}>
                <Message.Header>{this.props.dimmer.error.message}</Message.Header>
                <Accordion>
                    <Accordion.Title onClick={() => this.props.toggleErrorMore()}>
                        <Icon name="dropdown" />
                        More information
                    </Accordion.Title>
                    <Accordion.Content active={this.props.dimmer.error.more.show}>
                        <p>{this.props.dimmer.error.more.message}</p>
                    </Accordion.Content>
                </Accordion>
            </Message>
        </Dimmer>;
    }
}

export default connect(store => {
    return {
        dimmer: store.dimmer
    };
}, {
    deactivateDimmer,
    toggleErrorMore
})(DimmerComponent);