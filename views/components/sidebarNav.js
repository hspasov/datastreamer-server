import React from "react";
import { Link, Route, Switch } from "react-router-dom";
import { Container, Divider, Dropdown, Grid, Header, Image, List, Menu, Segment, Sidebar } from "semantic-ui-react";
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
        this.props.dispatch(push(`/${route}`));
    }

    render() {
        return (
            <Sidebar.Pushable as={Segment}>
                <Sidebar as={Menu} animation="slide along" width="thin" visible={true} icon="labeled" vertical inverted>
                    <Menu.Item onClick={this.goTo.bind(this, "home")}>Home</Menu.Item>
                    <Menu.Item as={Link} to="/login">Log in</Menu.Item>
                    <Menu.Item onClick={() => this.goTo("register")}>Register</Menu.Item>
                    <Menu.Item onClick={() => this.goTo("connect")}>Connect</Menu.Item >
                    <Menu.Item onClick={this.disconnect}>Disconnect</Menu.Item>
                    <Menu.Item onClick={this.logout}>Logout</Menu.Item>
                </Sidebar>
                <Sidebar.Pusher>
                    <Segment basic>
                        <Container text style={{ marginTop: '7em' }}>
                            <Switch>
                                <Route path="/home" component={HomePage} />
                                <Route path="/login" component={LoginPage} />
                                <Route path="/register" component={RegisterPage} />
                                <Route path="/connect" component={ConnectPage} />
                            </Switch>
                        </Container>

                        <Segment
                            inverted
                            vertical
                            style={{ margin: '5em 0em 0em', padding: '5em 0em' }}
                        >
                            <Container textAlign='center'>
                                <Grid divided inverted stackable>
                                    <Grid.Row>
                                        <Grid.Column width={3}>
                                            <Header inverted as='h4' content='Group 1' />
                                            <List link inverted>
                                                <List.Item as='a'>Link One</List.Item>
                                                <List.Item as='a'>Link Two</List.Item>
                                                <List.Item as='a'>Link Three</List.Item>
                                                <List.Item as='a'>Link Four</List.Item>
                                            </List>
                                        </Grid.Column>
                                        <Grid.Column width={3}>
                                            <Header inverted as='h4' content='Group 2' />
                                            <List link inverted>
                                                <List.Item as='a'>Link One</List.Item>
                                                <List.Item as='a'>Link Two</List.Item>
                                                <List.Item as='a'>Link Three</List.Item>
                                                <List.Item as='a'>Link Four</List.Item>
                                            </List>
                                        </Grid.Column>
                                        <Grid.Column width={3}>
                                            <Header inverted as='h4' content='Group 3' />
                                            <List link inverted>
                                                <List.Item as='a'>Link One</List.Item>
                                                <List.Item as='a'>Link Two</List.Item>
                                                <List.Item as='a'>Link Three</List.Item>
                                                <List.Item as='a'>Link Four</List.Item>
                                            </List>
                                        </Grid.Column>
                                        <Grid.Column width={3}>
                                            <Header inverted as='h4' content='Footer Header' />
                                            <p>Extra space for a call to action inside the footer that could help re-engage users.</p>
                                        </Grid.Column>
                                    </Grid.Row>
                                </Grid>

                                <Divider inverted section />
                                <Image
                                    centered
                                    size='mini'
                                    src='/logo.png'
                                />
                                <List horizontal inverted divided link>
                                    <List.Item as='a' href='#'>Site Map</List.Item>
                                    <List.Item as='a' href='#'>Contact Us</List.Item>
                                    <List.Item as='a' href='#'>Terms and Conditions</List.Item>
                                    <List.Item as='a' href='#'>Privacy Policy</List.Item>
                                </List>
                            </Container>
                        </Segment>
                    </Segment>
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        );
    }
}

const SidebarNavComponent = connect(store => {
    return {
        client: store.client,
        provider: store.provider,
        router: store.router
    };
})(SidebarNav);

export default SidebarNavComponent;