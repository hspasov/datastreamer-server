import React from "react";
import { Breadcrumb, Divider, Grid, Header, Icon, Image, Menu, Segment, Sidebar } from "semantic-ui-react";
import { Link, Route, Switch } from "react-router-dom";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import { logoutClient } from "../../store/actions/client";
import { disconnectClient } from "../../store/actions/provider";
import { toggleSidebar } from "../../store/actions/sidebar";
import disconnect from "../../modules/disconnect";
import HomePage from "../pages/home.page";
import LoginPage from "../pages/login.page";
import RegisterPage from "../pages/register.page";
import ConnectPage from "../pages/connect.page";
import SettingsPage from "../pages/settings-page";
import formurlencoded from "form-urlencoded";
import {
    openDirectory,
    navigateBack,
    changePath,
    clearPath
} from "../../store/actions/navigation";

class App extends React.Component {
    constructor(props) {
        super(props);

        this.disconnect = disconnect.bind(this);
        this.logout = this.logout.bind(this);
        this.toggleSidebar = this.toggleSidebar.bind(this);
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
        }).catch(error => {
            console.log(error);
        });
    }

    toggleSidebar() {
        this.props.dispatch(toggleSidebar());
    }

    render() {
        const client = (this.props.client.token) ?
            <div>
                <Menu.Item><Header as="h4" color="grey">Your client</Header></Menu.Item>
                <Menu.Item><Header as="h4" color="grey">{this.props.client.username}</Header></Menu.Item>
                <Menu.Item as={Link} to="/settings">Account settings</Menu.Item>
                <Menu.Item onClick={this.logout}>Logout</Menu.Item>
                <Menu.Item><Divider /></Menu.Item>
            </div> :
            <div>
                <Menu.Item><Header as="h4" color="grey">Your client</Header></Menu.Item>
                <Menu.Item as={Link} to="/login">Log in</Menu.Item>
                <Menu.Item as={Link} to="/register">Register</Menu.Item>
                <Menu.Item><Divider /></Menu.Item>
            </div>;

        const connection = <div>
            <Menu.Item><Header as="h4" color="grey">Connection</Header></Menu.Item>
            <Menu.Item>{
                (this.props.provider.token) ?
                    <div>
                        <Header as="h2" color="green">{this.props.provider.username}</Header>
                        <Menu.Item onClick={this.disconnect}>Disconnect</Menu.Item>
                    </div> :
                    <Header as="h2" color="red">No provider</Header>
            }</Menu.Item>
            <Menu.Item><Divider /></Menu.Item>
        </div>;

        const availableProviders = <div>
            <Menu.Item><Header as="h4" color="grey">Available Providers</Header></Menu.Item>
            <Menu.Item as={Link} to="/connect"><Grid><Grid.Row centered><Icon name="plus" corner />Connect to provider</Grid.Row></Grid></Menu.Item>
            <Menu.Item><Divider /></Menu.Item>
        </div>;

        const sideMenu = <Menu icon="labeled" vertical inverted borderless fixed="left" style={{ width: "250px" }}>
            <Menu.Item style={{width: "250px"}} onClick={this.toggleSidebar} as="a" header active={this.props.sidebar.visible}>
                <Grid><Grid.Row centered>
                    <Icon name="list layout" />
                    DataStreamer
                        </Grid.Row></Grid>
            </Menu.Item>;
                    {client}
            {this.props.client.token && connection}
            {this.props.client.token && availableProviders}
        </Menu>;

        const menuColor = (this.props.client.token) ? "red" : "blue";

        const logo = <Menu.Item onClick={this.toggleSidebar} as='a' header active={this.props.sidebar.visible}>
            <Icon name="list layout" />
            DataStreamer
            </Menu.Item>;

        const topMenu = <Menu color={menuColor} inverted fluid size="massive" fixed="top">
            {logo}
        </Menu>

        return <div style={this.props.sidebar.visible ? { height: "100%", marginLeft: "250px" } : { height: "100%" }}>
            {this.props.sidebar.visible && sideMenu}
            {this.props.router.location.pathname !== "/home" && topMenu}
            <Switch>
                <Route path="/home" component={HomePage} />
                <Route path="/login" component={LoginPage} />
                <Route path="/register" component={RegisterPage} />
                <Route path="/connect" component={ConnectPage} />
                <Route path="/settings" component={SettingsPage} />
            </Switch>
        </div>;
    }
}

const AppContainer = connect(store => {
    return {
        client: store.client,
        provider: store.provider,
        sidebar: store.sidebar,
        navigation: store.navigation,
        dimmer: store.dimmer,
        router: store.router
    };
})(App);

export default AppContainer;