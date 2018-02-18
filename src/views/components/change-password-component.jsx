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
            loading: false,
            hasFormErrors: false,
            formErrors: []
        };
    }
    handleSubmit(form) {
        this.setState({
            loading: true
        });
        if (!(form.oldPassword &&
            form.newPassword &&
            form.confirmNewPassword)) {

            this.setState({
                loading: false,
                hasFormErrors: true,
                formErrors: ["empty"]
            });
            return;
        } else if (form.newPassword !== form.confirmNewPassword) {
            this.setState({
                loading: false,
                hasFormErrors: true,
                formErrors: ["match"]
            });
            return;
        }
        this.setState({
            hasFormErrors: false,
            formErrors: []
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
            this.setState({ loading: false });
            if (response.status === 201) {
                return response.json();
            } else {
                throw response;
            }
        }).then(json => {
            this.props.loginClient({
                token: json.token,
                username: this.props.client.username
            });
            this.props.history.push("/home");
        }).catch(error => {
            this.setState({
                hasFormErrors: true,
                formErrors: [error.status]
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
                    required: true,
                    autocomplete: "off"
                },
                {
                    label: "newPassword",
                    icon: "lock",
                    placeholder: "New password",
                    type: "password",
                    required: true,
                    autocomplete: "new-password"
                },
                {
                    label: "confirmNewPassword",
                    icon: "lock",
                    placeholder: "Confirm new password",
                    type: "password",
                    required: true,
                    autocomplete: "new-password"
                }
            ]}
            submit={{
                label: "Submit",
                color: "black",
                onClick: form => this.handleSubmit(form)
            }}
            error={{
                hasFormErrors: this.state.hasFormErrors,
                formErrors: this.state.formErrors
            }}
            loading={this.state.loading}
        />;
    }
}

const ChangePasswordComponent = withRouter(connect(store => {
    return {
        client: store.client
    }
}, { loginClient })(ChangePassword));

export default ChangePasswordComponent;