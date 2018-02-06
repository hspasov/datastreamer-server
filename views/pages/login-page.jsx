import React from "react";
import { Link, Redirect, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { Helmet } from "react-helmet";
import { loginClient } from "../../store/actions/client";
import formurlencoded from "form-urlencoded";
import { Grid, Message, Segment } from "semantic-ui-react";
import FormComponent from "../components/form-component.jsx";
import FormSubmitError from "../components/form-submit-error.jsx";

class Login extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: "",
            password: "",
            hasFormErrors: false,
            formErrors: []
        };
    }

    handleSubmit(form) {
        if (!(form.username && form.password)) {
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
            username: form.username,
            password: form.password
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
            this.props.loginClient(json);
            this.props.history.push("/connect");
        }).catch(errorCode => {
            console.log(errorCode);
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
        return <Segment className="loginPage" padded="very" attached="top">
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
                    title="Login to your account"
                    fields={[
                        {
                            label: "username",
                            icon: "user",
                            placeholder: "Username",
                            type: "text",
                            required: true
                        },
                        {
                            label: "password",
                            icon: "lock",
                            placeholder: "Password",
                            type: "password",
                            required: true
                        }
                    ]}
                    submit={{
                        label: "Login",
                        color: "black",
                        onClick: form => this.handleSubmit(form)
                    }}
                />
                {/* <Message>
                    Don't have an account? <Link to="/register">Register</Link>
                </Message> */}
            </Grid>
        </Segment>;
    }
}

const LoginPage = withRouter(connect(null, { loginClient })(Login));

export default LoginPage;