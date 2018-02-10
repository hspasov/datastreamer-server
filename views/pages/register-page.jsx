import React from "react";
import { Link, Redirect, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { Helmet } from "react-helmet";
import { loginClient } from "../../store/actions/client";
import formurlencoded from "form-urlencoded";
import { Button, Form, Grid, Header, Message, Segment } from "semantic-ui-react";
import FormComponent from "../components/form-component.jsx";

class Register extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            hasFormErrors: false,
            formErrors: []
        }
    }

    handleSubmit(form) {
        this.setState({ loading: true });
        if (!(form.username && form.password)) {
            this.setState({
                loading: false,
                hasFormErrors: true,
                formErrors: ["empty"]
            });
            return;
        }

        if (form.password != form.confirmPassword) {
            this.setState({
                loading: false,
                hasFormErrors: true,
                formErrors: ["match"]
            });
            return;
        }

        const formData = {
            username: form.username,
            password: form.password
        };

        fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", },
            body: formurlencoded(formData)
        }).then(response => {
            this.setState({ loading: false });
            if (response.status == 201) {
                return response.json();
            } else {
                throw response;
            }
        }).then(json => {
            this.props.loginClient(json);
            this.props.history.push("/connect");
        }).catch(error => {
            this.setState({
                hasFormErrors: true,
                formErrors: [error.status]
            });
        });
    }

    render() {
        if (this.props.client.token || this.props.provider.token) {
            return <Redirect to="/home"></Redirect>;
        }

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
                <FormComponent
                    title="Create new account"
                    fields={[
                        {
                            label: "username",
                            icon: "user",
                            placeholder: "Username",
                            type: "text",
                            required: true,
                            autocomplete: "username"
                        },
                        {
                            label: "password",
                            icon: "lock",
                            placeholder: "Password",
                            type: "password",
                            required: true,
                            autocomplete: "new-password"
                        },
                        {
                            label: "confirmPassword",
                            icon: "lock",
                            placeholder: "Confirm password",
                            type: "password",
                            required: true,
                            autocomplete: "new-password"
                        }
                    ]}
                    submit={{
                        label: "Register",
                        color: "black",
                        onClick: form => this.handleSubmit(form)
                    }}
                    error={{
                        hasFormErrors: this.state.hasFormErrors,
                        formErrors: this.state.formErrors
                    }}
                    loading={this.state.loading}
                    message={<Message>
                        Already have an account? <Link to="/login">Login</Link>
                    </Message>}
                />
            </Grid>
        </Segment>;
    }
}

const RegisterPage = withRouter(connect(store => {
    return {
        client: store.client,
        provider: store.provider
    };
}, { loginClient })(Register));

export default RegisterPage;