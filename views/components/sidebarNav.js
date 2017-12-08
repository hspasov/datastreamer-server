import React from "react";
import { Link, Route, Switch } from "react-router-dom";
import { Menu, Segment, Sidebar, Sticky } from "semantic-ui-react";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import { logoutClient } from "../../store/actions/client";
import { disconnectClient } from "../../store/actions/provider";
import HomePage from "../pages/home.page";
import LoginPage from "../pages/login.page";
import RegisterPage from "../pages/register.page";
import ConnectPage from "../pages/connect.page";
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
            this.props.history.push("/home");
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
            this.props.history.push("/");
        }).catch(error => {
            console.log(error);
        });
    }

    render() {
        return (
            <Sidebar.Pushable as={Segment} attached>
                <Sidebar as={Menu} animation="slide along" width="thin" visible={this.props.sidebar.visible} icon="labeled" vertical inverted>
                    <Menu.Item as={Link} to="/home">Home</Menu.Item>
                    <Menu.Item as={Link} to="/login">Log in</Menu.Item>
                    <Menu.Item as={Link} to="/register">Register</Menu.Item>
                    <Menu.Item as={Link} to="/connect">Connect</Menu.Item >
                    <Menu.Item onClick={this.disconnect}>Disconnect</Menu.Item>
                    <Menu.Item onClick={this.logout}>Logout</Menu.Item>
                </Sidebar>
                <Sidebar.Pusher>
                    <div id="page">
                        <style>{`
                        body > div,
                        body > div#page {
                            height: 100%;
                        },
                        div#page {
                            overflow-y:scroll;
                        }
                        `}</style>
                        <Switch>
                            <Route path="/home" component={HomePage} />
                            <Route path="/login" component={LoginPage} />
                            <Route path="/register" component={RegisterPage} />
                            <Route path="/connect" component={ConnectPage} />
                        </Switch>
                    </div>
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        );
    }
}

const SidebarNavComponent = connect(store => {
    return {
        client: store.client,
        provider: store.provider,
        sidebar: store.sidebar
    };
})(SidebarNav);

export default SidebarNavComponent;