import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import formurlencoded from "form-urlencoded";
import { logoutClient } from "../../store/actions/client";
import { disconnectClient } from "../../store/actions/provider";
import FormComponent from "./form-component.jsx";

class DeleteAccount extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            hasFormErrors: false,
            formErrors: []
        };
    }
    handleSubmit(form) {
        if (!form.password) {
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
            token: this.props.client.token,
            password: form.password
        };
        fetch("/delete", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formurlencoded(formData)
        }).then(response => {
            if (response.status === 200) {
                this.props.disconnectClient();
                this.props.logoutClient();
                this.props.history.push("/login");
            } else {
                throw response;
            }
        }).catch(error => {
            this.setState({
                hasFormErrors: true,
                formErrors: [error.status]
            });
        });
    }

    render() {
        return <FormComponent
            title="Delete account"
            fields={[
                {
                    label: "password",
                    icon: "lock",
                    placeholder: "Password",
                    type: "password",
                    required: true,
                    autocomplete: "off"
                }
            ]}
            submit={{
                label: "DELETE",
                color: "red",
                onClick: form => this.handleSubmit(form)
            }}
            error={{
                hasFormErrors: this.state.hasFormErrors,
                formErrors: this.state.formErrors
            }}
        />;
    }
}

const DeleteAccountComponent = withRouter(connect(store => {
    return {
        client: store.client
    };
}, {
    logoutClient,
    disconnectClient
})(DeleteAccount));

export default DeleteAccountComponent;