import React from "react";
import { Link, Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import { loginClient } from "../../store/actions/client";
import formurlencoded from "form-urlencoded";
import { Button, Form, Grid, Header, Message, Segment } from "semantic-ui-react";
import FormSubmitError from "../components/formSubmitError.component";

class Login extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: "",
            password: "",
            hasFormErrors: false,
            formErrors: []
        };

        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleUsernameChange(event) {
        event.preventDefault();
        this.setState({
            username: event.target.value
        });
    }

    handlePasswordChange(event) {
        event.preventDefault();
        this.setState({
            password: event.target.value
        });
    }

    handleSubmit() {
        if (!(this.state.username && this.state.password)) {
            this.setState({
                hasFormErrors: true,
                formErrors: ["empty"]
            });
            return;
        }
        this.setState({
            hasFormErrors: false
        });

        const formData = {
            username: this.state.username,
            password: this.state.password
        }

        fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", },
            body: formurlencoded(formData)
        }).then(response => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw response.status;
            }
        }).then(json => {
            this.props.dispatch(loginClient(json));
            // One dispatch SHOULD work, but
            // it only changes the link in navbar
            // Component rendering happens only on second dispatch
            this.props.dispatch(push("/connect"));
            this.props.dispatch(push("/connect"));
        }).catch(errorCode => {
            let formErrors;
            switch (errorCode) {
                case 404:
                    formErrors = ["verification"];
                    break;
                case 500:
                    formErrors = ["error"];
                    break;
                default:
                    formErrors = ["connect"];
            }
            this.setState({
                hasFormErrors: true,
                formErrors
            });
        });
    }

    render() {
        return <Segment>
        <Grid textAlign="center" style={{ height: "100%" }} verticalAlign="middle">
            <Grid.Column style={{ maxWidth: 450 }} >
                <Header as="h2" color="black" textAlign="center">
                    Log-in to your account
                </Header>
                <Form size="massive">
                <Segment>
                        <Form.Input
                            fluid
                            icon="user"
                            iconPosition="left"
                            placeholder="Username"
                            required
                            error
                            onChange={this.handleUsernameChange}/>
                        <Form.Input
                            fluid
                            icon="lock"
                            iconPosition="left"
                            placeholder="Password"
                            type="password"
                            required
                            onChange={this.handlePasswordChange}/>
                        <Button color="black" fluid size="large" onClick={this.handleSubmit}>Login</Button>
                        <FormSubmitError visible={this.state.hasFormErrors} errors={this.state.formErrors} />
                    </Segment>
                </Form>
                <Message>
                    Don't have an account? <Link to="/register">Register</Link>
                </Message>
            </Grid.Column>
            </Grid>
        </Segment>;
    }
}

const LoginPage = connect(store => {
    return {
        client: store.client,
        router: store.router
    };
})(Login);

export default LoginPage;