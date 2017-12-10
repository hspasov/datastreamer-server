import React from "react";
import { Link, Route, Switch } from "react-router-dom";
import { Divider, Grid, Header, Icon, Menu, Segment, Sidebar, Sticky } from "semantic-ui-react";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import { Helmet } from "react-helmet";
import { logoutClient } from "../../store/actions/client";
import { disconnectClient } from "../../store/actions/provider";
import disconnect from "../../modules/disconnect";
import HomePage from "../pages/home.page";
import LoginPage from "../pages/login.page";
import RegisterPage from "../pages/register.page";
import ConnectPage from "../pages/connect.page";
import formurlencoded from "form-urlencoded";

class SidebarNav extends React.Component {
    constructor(props) {
        super(props);

        this.disconnect = disconnect.bind(this);
        this.logout = this.logout.bind(this);
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
            this.props.history.push("/login");
        }).catch(error => {
            console.log(error);
        });
    }

    render() {
        const client = (this.props.client.token) ?
            <div>
                <Menu.Item><Header as="h4" color="grey">Your client</Header></Menu.Item>
                <Menu.Item><Header as="h4" color="grey">test1</Header></Menu.Item>
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
                        <Header as="h2" color="green">provider1</Header>
                        <Menu.Item onClick={this.disconnect}>Disconnect</Menu.Item>
                    </div> :
                    <Header as="h2" color="red">No provider</Header>
            }</Menu.Item>
            <Menu.Item><Divider /></Menu.Item>
        </div>;

        const availableProviders = <div>
            <Menu.Item><Header as="h4" color="grey">Available Providers</Header></Menu.Item>
            <Menu.Item as={Link} to="/connect"><Grid><Grid.Row centered><Icon name="plus" corner/>Connect to provider</Grid.Row></Grid></Menu.Item>
            <Menu.Item><Divider /></Menu.Item>
        </div>;

        return (
            <Sidebar.Pushable as={Segment} attached>
                <Sidebar as={Menu} animation="slide along" width="wide" size="massive" visible={this.props.sidebar.visible} icon="labeled" vertical inverted borderless>
                    {/* <Menu.Item as={Link} to="/home">Home</Menu.Item> */}
                    {client}
                    {this.props.client.token && connection}
                    {this.props.client.token && availableProviders}
                </Sidebar>
                <Sidebar.Pusher>
                    <div id="page">
                        <Helmet>
                            <style>{`
                            body > div,
                            div#page {
                                height: 100%;
                            }
                            `}</style>
                        </Helmet>
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