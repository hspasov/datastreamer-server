import React from "react";
import { Navbar, Button } from "react-bootstrap";
import { connect } from "react-redux";
import { logoutClient } from "../../store/actions/client";
import { disconnectClient } from "../../store/actions/provider";
import formurlencoded from "form-urlencoded";

class App extends React.Component {
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
            <div>
                <Navbar fluid>
                    <Navbar.Header>
                        <Navbar.Brand>
                            <a href="#">DataStreamer</a>
                        </Navbar.Brand>
                        <Button
                            bsStyle="primary"
                            className="btn-margin"
                            onClick={this.goTo.bind(this, "home")}>
                            Home
                        </Button>
                        <Button
                            bsStyle="primary"
                            className="btn-margin"
                            onClick={this.goTo.bind(this, "login")}>
                            Login
                        </Button>
                        <Button
                            bsStyle="primary"
                            className="btn-margin"
                            onClick={this.goTo.bind(this, "register")}>
                            Register
                        </Button>
                        <Button
                            bsStyle="primary"
                            className="btn-margin"
                            onClick={this.goTo.bind(this, "connect")}>
                            Connect
                        </Button>
                        <Button
                            bsStyle="primary"
                            className="btn-margin"
                            onClick={this.disconnect}>
                            Disconnect
                        </Button>
                        <Button
                            bsStyle="primary"
                            className="btn-margin"
                            onClick={this.logout}>
                            Logout
                        </Button>
                    </Navbar.Header>
                </Navbar>
            </div>
        );
    }
}

const AppContainer = connect(store => {
    return {
        client: store.client,
        provider: store.provider
    };
})(App);

export default AppContainer;