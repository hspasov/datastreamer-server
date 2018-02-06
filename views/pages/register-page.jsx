import React from "react";
import { Link, Redirect, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { Helmet } from "react-helmet";
import { loginClient } from "../../store/actions/client";
import formurlencoded from "form-urlencoded";
import { Button, Form, Grid, Header, Message, Segment } from "semantic-ui-react";
import FormComponent from "../components/form-component.jsx";
import FormSubmitError from "../components/form-submit-error.jsx";

class Register extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            hasFormErrors: false,
            formErrors: []
        }
    }

    handleSubmit(form) {
        if (!(form.username && form.password)) {
            this.setState({
                hasFormErrors: true,
                formErrors: ["empty"]
            });
            return;
        }

        if (form.password != form.confirmPassword) {
            this.setState({
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
                <FormComponent
                    title="Create new account"
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
                        },
                        {
                            label: "confirmPassword",
                            icon: "lock",
                            placeholder: "Confirm password",
                            type: "password",
                            required: true
                        }
                    ]}
                    submit={{
                        label: "Register",
                        color: "black",
                        onClick: form => this.handleSubmit(form)
                    }}
                />
                    {/* <Message>
                        Already have an account? <Link to="/login">Login</Link>
                    </Message> */}
            </Grid>
        </Segment>;
    }
}

const RegisterPage = withRouter(connect(null, { loginClient })(Register));

export default RegisterPage;