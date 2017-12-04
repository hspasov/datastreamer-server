import React from "react";
import { Link, Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import { loginClient } from "../../store/actions/client";
import formurlencoded from "form-urlencoded";
import { Button, Form, Grid, Header, Message, Segment } from "semantic-ui-react";

class Register extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: "",
            password: "",
            confirmPassword: "",
            formRaised: false
        }

        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleConfirmPasswordChange = this.handleConfirmPasswordChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleUsernameChange(event) {
        event.preventDefault();
        this.setState({
            username: event.target.value
        })
    }

    handlePasswordChange(event) {
        event.preventDefault();
        this.setState({
            password: event.target.value
        });
    }

    handleConfirmPasswordChange(event) {
        event.preventDefault();
        this.setState({
            confirmPassword: event.target.value
        });
    }

    handleSubmit() {
        if (this.state.password != this.state.confirmPassword) {
            console.log("Passwords don't match");
            return;
        }
        const formData = {
            username: this.state.username,
            password: this.state.password
        };
        fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", },
            body: formurlencoded(formData)
        }).then(response => {
            if (response.status == 201) {
                return response.json();
            } else {
                throw `Authentication failed\n${response}`;
            }
        }).then(json => {
            this.props.dispatch(loginClient(json));
            this.props.history.push("/connect");
        }).catch(error => {
            console.log(error);
        });
    }

    render() {
        return (
            <Grid
                textAlign="center"
                style={{ height: "100%" }}
                verticalAlign="middle"
            >
                <Grid.Column style={{ maxWidth: 450 }} >
                    <Header as="h2" color="black" textAlign="center">
                        Create new account
                        </Header>
                    <Form size="massive">
                        <Segment>
                            <Form.Input
                                fluid
                                icon="user"
                                iconPosition="left"
                                placeholder="Username"
                                required
                                onChange={this.handleUsernameChange}
                            />
                            <Form.Input
                                fluid
                                icon="lock"
                                iconPosition="left"
                                placeholder="Password"
                                type="password"
                                required
                                onChange={this.handlePasswordChange}
                            />
                            <Form.Input
                                fluid
                                icon="lock"
                                iconPosition="left"
                                placeholder="Confirm password"
                                type="password"
                                onChange={this.handleConfirmPasswordChange}
                            />
                            <Button color="black" fluid size="large" onClick={this.handleSubmit}>Register</Button>
                        </Segment>
                    </Form>
                    <Message>
                        Already have an account? <Link to="/login">Login</Link>
                    </Message>
                </Grid.Column>
            </Grid>
        )
    }
}

const RegisterPage = connect(store => {
    return {
        client: store.client,
        router: store.router
    };
})(Register);

export default RegisterPage;