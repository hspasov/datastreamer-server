import React from "react";
import { Link } from "react-router";
import { Sidebar, Segment, Menu } from "semantic-ui-react";
import { connect } from "react-redux";
import { logoutClient } from "../../store/actions/client";
import { disconnectClient } from "../../store/actions/provider";
import formurlencoded from "form-urlencoded";

class SidebarNav extends React.Component {
    constructor(props) {
        super(props);

        this.disconnect = this.disconnect.bind(this);
        this.logout = this.logout.bind(this);
    }

    disconnect() {
        const formData = {
            connectionToken: this.props.provider.token
        };
        fetch("/disconnect", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", },
            body: formurlencoded(formData)
        }).then(response => {
            this.props.dispatch(disconnectClient());
            this.goTo("home");
        }).catch(error => {
            console.log(error);
        });
    }

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
            this.props.dispatch(disconnectClient());
            this.props.dispatch(logoutClient());
            this.goTo("");
        }).catch(error => {
            console.log(error);
        });
    }

    goTo(route) {
        this.props.history.replace(`/${route}`);
    }

    render() {
        return (
            <Sidebar.Pushable as={Segment}>
                <Sidebar as={Menu} animation="slide along" width="thin" visible={true} icon="labeled" vertical inverted>
                    <Menu.Item onClick={this.disconnect}>Disconnect</Menu.Item>
                    <Menu.Item onClick={this.logout}>Logout</Menu.Item>
                </Sidebar>
                <Sidebar.Pusher>
                    <Segment basic>{this.props.children}</Segment>
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        );
    }
}

const SidebarNavComponent = connect(store => {
    return {
        client: store.client,
        provider: store.provider
    };
})(SidebarNav);

export default SidebarNavComponent;