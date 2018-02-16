import React from "react";
import { Link, Redirect, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { Helmet } from "react-helmet";
import { loginClient } from "../../store/actions/client";
import formurlencoded from "form-urlencoded";
import { Grid, Message, Segment } from "semantic-ui-react";
import FormComponent from "../components/form-component.jsx";

class Login extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            hasFormErrors: false,
            formErrors: []
        };
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
        this.setState({
            hasFormErrors: false
        });

        const formData = {
            username: form.username,
            password: form.password
        }

        fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", },
            body: formurlencoded(formData)
        }).then(response => {
            this.setState({ loading: false });
            if (response.status === 200) {
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

        return <Segment className="loginPage" padded="very">
            <Helmet>
                <style>{`
            body > div,
            body > div > div,
            body > div > div > div.loginPage {
                height: 100%;
            }
            `}</style>
            </Helmet>
            <Grid textAlign="center" style={{ height: "100%" }} verticalAlign="middle">
                <FormComponent
                    title="Log into your account"
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
                            autocomplete: "current-password"
                        }
                    ]}
                    submit={{
                        label: "Log in",
                        color: "black",
                        onClick: form => this.handleSubmit(form)
                    }}
                    error={{
                        hasFormErrors: this.state.hasFormErrors,
                        formErrors: this.state.formErrors
                    }}
                    loading={this.state.loading}
                    message={<Message>
                        Don't have an account? <Link to="/register">Register</Link>
                    </Message>}
                />
            </Grid>
        </Segment>;
    }
}

const LoginPage = withRouter(connect(store => {
    return {
        client: store.client,
        provider: store.provider
    };
}, { loginClient })(Login));

export default LoginPage;