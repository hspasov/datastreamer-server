import React from "react";
import { Redirect } from "react-router";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Helmet } from "react-helmet";
import { connectClient } from "../../store/actions/provider";
import disconnect from "../../modules/disconnect";
import formurlencoded from "form-urlencoded";
import { Grid, Segment } from "semantic-ui-react";
import FormComponent from "../components/form-component.jsx";

class Connect extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            hasFormErrors: false,
            formErrors: []
        }

        // If there is connection disconnect
        this.props.provider.token && disconnect.bind(this)();
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
            password: form.password,
            token: this.props.client.token
        }

        fetch("/connect", {
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
            this.props.connectClient(json);
            this.props.history.push("/home");
        }).catch(error => {
            this.setState({
                hasFormErrors: true,
                formErrors: [error.status]
            });
        });
    }

    render() {
        if (!this.props.client.token) {
            return <Redirect to="/login"></Redirect>;
        }

        return <Segment className="connectPage" padded="very" attached="top">
            <Helmet>
                <style>{`
            body > div,
            body > div > div,
            body > div > div > div.connectPage {
                height: 100%;
            }
            `}</style>
            </Helmet>
            <Grid textAlign="center" style={{ height: "100%" }} verticalAlign="middle">
                <FormComponent
                    title="Connect to provider"
                    fields={[
                        {
                            label: "username",
                            icon: "user",
                            placeholder: "Provider name",
                            type: "text",
                            required: true,
                            autocomplete: "off"
                        },
                        {
                            label: "password",
                            icon: "lock",
                            placeholder: "Client connect password",
                            type: "password",
                            required: true,
                            autocomplete: "off"
                        }
                    ]}
                    submit={{
                        label: "Connect",
                        color: "black",
                        onClick: form => this.handleSubmit(form)
                    }}
                    error={{
                        hasFormErrors: this.state.hasFormErrors,
                        formErrors: this.state.formErrors
                    }}
                />
            </Grid>
        </Segment>;
    }
}

const ConnectPage = withRouter(connect(store => {
    return {
        client: store.client,
        provider: store.provider
    };
}, { connectClient })(Connect));

export default ConnectPage;