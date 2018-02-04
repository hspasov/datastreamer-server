import React from "react";
import { Link, Redirect, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { Helmet } from "react-helmet";
import { loginClient } from "../../store/actions/client";
import formurlencoded from "form-urlencoded";
import { Button, Form, Grid, Header, Message, Segment } from "semantic-ui-react";
import FormSubmitError from "../components/form-submit-error.jsx";

class Register extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: "",
            password: "",
            confirmPassword: "",
            hasFormErrors: false,
            formErrors: []
        }
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
        if (!(this.state.username && this.state.password)) {
            this.setState({
                hasFormErrors: true,
                formErrors: ["empty"]
            });
            return;
        }

        if (this.state.password != this.state.confirmPassword) {
            this.setState({
                hasFormErrors: true,
                formErrors: ["match"]
            });
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
                throw response.status;
            }
        }).then(json => {
            this.props.loginClient(json);
            this.props.history.push("/connect");
        }).catch(errorCode => {
            let formErrors;
            switch (errorCode) {
                case 400:
                    formErrors = ["format"];
                    break;
                case 412:
                    formErrors = ["exists"];
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
        return <Segment className="registerPage" padded="very" attached="top">
            <Helmet>
                <style>{`
            body > div,
            body > div > div,
            body > div > div > div.registerPage {
                height: 100%;
            }
            `}</style>
            </Helmet>
            <Grid textAlign="center" style={{ height: "100%" }} verticalAlign="middle">
                <Grid.Column style={{ maxWidth: 450 }}>
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
                                onChange={event => this.handleUsernameChange(event)}
                            />
                            <Form.Input
                                fluid
                                icon="lock"
                                iconPosition="left"
                                placeholder="Password"
                                type="password"
                                required
                                onChange={event => this.handlePasswordChange(event)}
                            />
                            <Form.Input
                                fluid
                                icon="lock"
                                iconPosition="left"
                                placeholder="Confirm password"
                                type="password"
                                onChange={event => this.handleConfirmPasswordChange(event)}
                            />
                            <Button color="black" fluid size="large" onClick={() => this.handleSubmit()}>Register</Button>
                            <FormSubmitError visible={this.state.hasFormErrors} errors={this.state.formErrors} />
                        </Segment>
                    </Form>
                    <Message>
                        Already have an account? <Link to="/login">Login</Link>
                    </Message>
                </Grid.Column>
            </Grid>
        </Segment>;
    }
}

const RegisterPage = withRouter(connect(null, { loginClient })(Register));

export default RegisterPage;