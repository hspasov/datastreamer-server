import React from "react";
import { Navbar, Button } from "react-bootstrap";

class AppContainer extends React.Component {
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
                    </Navbar.Header>
                </Navbar>
            </div>
        );
    }
}

export default AppContainer;