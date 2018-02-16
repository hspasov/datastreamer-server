import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";
import { Divider, Header, Menu } from "semantic-ui-react";
import formurlencoded from "form-urlencoded";
import { logoutClient } from "../../store/actions/client";
import { disconnectClient } from "../../store/actions/provider";

class ClientMenu extends React.Component {
    logout() {
        const formData = {
            clientToken: this.props.client.token,
            connectionToken: this.props.provider.token
        };
        fetch("/logout", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", },
            body: formurlencoded(formData)
        }).then(response => {
            this.props.disconnectClient();
            this.props.logoutClient();
        }).catch(error => {
            console.log(error);
        });
    }

    render() {
        if (this.props.client.token) {
            return <div>
                <Menu.Item><Header as="h4" color="grey"></Header></Menu.Item>
                <Menu.Item><Header as="h4" color="grey">{this.props.client.username}</Header></Menu.Item>
                <Menu.Item as={Link} to="/settings">Account settings</Menu.Item>
                <Menu.Item onClick={() => this.logout()}>Log out</Menu.Item>
                <Menu.Item><Divider /></Menu.Item>
            </div>;
        } else {
            return <div>
                <Menu.Item><Header as="h4" color="grey">Your client</Header></Menu.Item>
                <Menu.Item as={Link} to="/login">Log in</Menu.Item>
                <Menu.Item as={Link} to="/register">Register</Menu.Item>
                <Menu.Item><Divider /></Menu.Item>
            </div>;
        }
    }
}

const ClientMenuComponent = withRouter(connect(store => {
    return {
        client: store.client,
        provider: store.provider
    };
}, {
    disconnectClient,
    logoutClient
})(ClientMenu));

export default ClientMenuComponent;