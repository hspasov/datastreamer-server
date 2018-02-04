import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Divider, Grid, Header, Icon, Menu } from "semantic-ui-react";
import disconnect from "../../modules/disconnect";
import { disconnectClient } from "../../store/actions/provider";

class ConnectionMenu extends React.Component {
    constructor(props) {
        super(props);

        this.disconnect = disconnect.bind(this);
    }

    render() {
        const providerOptions = (this.props.provider.token) ?
            <div>
                <Menu.Item as={Link} to="/home" color="green">{this.props.provider.username}</Menu.Item>
                <Menu.Item onClick={this.disconnect}>Disconnect</Menu.Item>
            </div> :
            <div>
                <Header as="h2" color="red">No provider</Header>
                <Menu.Item as={Link} to="/connect">
                    <Grid>
                        <Grid.Row centered>
                            <Icon name="plus" corner />
                            Connect to provider
                        </Grid.Row>
                    </Grid>
                </Menu.Item>
            </div>;

        return (this.props.client.token) ? <div>
                <Menu.Item><Header as="h4" color="grey">Connection</Header></Menu.Item>
                <Menu.Item>{providerOptions}</Menu.Item>
                <Menu.Item><Divider /></Menu.Item>
            </div> : null;
    }
}

const ConnectionMenuComponent = connect(store => {
    return {
        client: store.client,
        provider: store.provider
    };
}, { disconnectClient })(ConnectionMenu);

export default ConnectionMenuComponent;