import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import formurlencoded from "form-urlencoded";
import { loginClient } from "../../store/actions/client";
import FormComponent from "./form-component.jsx";

class ChangePassword extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            hasFormErrors: false,
            formErrors: []
        };
    }
    handleSubmit(form) {
        if (!(form.oldPassword &&
            form.newPassword &&
            form.confirmNewPassword)) {

            this.setState({
                hasFormErrors: true,
                formErrors: ["empty"]
            });
            return;
        } else if (form.newPassword !== form.confirmNewPassword) {
            this.setState({
                hasFormErrors: true,
                formErrors: ["match"]
            });
            return;
        }
        this.setState({
            hasFormErrors: false
        });

        const formData = {
            token: this.props.client.token,
            oldPassword: form.oldPassword,
            newPassword: form.newPassword
        };

        fetch("/account", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formurlencoded(formData)
        }).then(response => {
            if (response.status === 201) {
                return response.json();
            } else {
                throw response.status;
            }
        }).then(json => {
            this.props.loginClient({
                token: json.token,
                username: this.props.client.username
            });
            this.props.history.push("/home");
        }).catch(errorCode => {
            let formErrors;
            switch (errorCode) {
                case 400:
                    formErrors = ["format"];
                    break;
                case 401:
                    formErrors = ["token"];
                    break;
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
        return <FormComponent
            title="Change password"
            fields={[
                {
                    label: "oldPassword",
                    icon: "lock",
                    placeholder: "Old password",
                    type: "password",
                    required: true
                },
                {
                    label: "newPassword",
                    icon: "lock",
                    placeholder: "New password",
                    type: "password",
                    required: true
                },
                {
                    label: "confirmNewPassword",
                    icon: "lock",
                    placeholder: "Confirm new password",
                    type: "password",
                    required: true
                }
            ]}
            submit={{
                label: "Submit",
                color: "black",
                onClick: form => this.handleSubmit(form)
            }}
        />;
    }
}

const ChangePasswordComponent = withRouter(connect(store => {
    return {
        client: store.client
    }
}, { loginClient })(ChangePassword));

export default ChangePasswordComponent;