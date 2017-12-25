import React from "react";
import { Redirect } from "react-router";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import { connectClient } from "../../store/actions/provider";
import disconnect from "../../modules/disconnect";
import formurlencoded from "form-urlencoded";
import { Button, Form, Grid, Header, Message, Segment } from "semantic-ui-react";
import FormSubmitError from "../components/formSubmitError.component";


class Connect extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: "",
            password: "",
            hasFormErrors: false,
            formErrors: []
        }

        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.props.provider.token && disconnect.bind(this)();
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
            password: this.state.password,
            token: this.props.client.token
        }

        fetch("/connect", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", },
            body: formurlencoded(formData)
        }).then(response => {
            if (response.status == 200) {
                return response.json();
            } else {
                throw response.status;
            }
        }).then(json => {
            this.props.dispatch(connectClient(json));
            // One dispatch SHOULD work, but
            // it only changes the link in navbar
            // Component rendering happens only on second dispatch
            this.props.dispatch(push("/home"));
            this.props.dispatch(push("/home"));
        }).catch(errorCode => {
            if (errorCode === 401) {
                this.setState({
                    hasFormErrors: true,
                    formErrors: ["token"]
                });
            } else if (errorCode === 404) {
                this.setState({
                    hasFormErrors: true,
                    formErrors: ["validation"]
                });
            } else if (errorCode === 500) {
                this.setState({
                    hasFormErrors: true,
                    formErrors: ["error"]
                });
            } else {
                this.setState({
                    hasFormErrors: true,
                    formErrors: ["connect"]
                });
            }
        });
    }

    render() {
        if (!this.props.client.token) {
            return <Redirect to="/login"></Redirect>;
        }

        return <Grid textAlign="center" style={{ height: "100%" }} verticalAlign="middle">
            <Grid.Column style={{ maxWidth: 450 }} >
                <Header as="h2" color="black" textAlign="center">
                    Connect to provider
                </Header>
                <Form size="massive">
                    <Segment>
                        <Form.Input
                            fluid
                            icon="user"
                            iconPosition="left"
                            placeholder="Provider name"
                            required
                            onChange={this.handleUsernameChange} />
                        <Form.Input
                            fluid
                            icon="lock"
                            iconPosition="left"
                            placeholder="Password"
                            type="password"
                            required
                            onChange={this.handlePasswordChange} />
                        <Button color="black" fluid size="large" onClick={this.handleSubmit}>Connect</Button>
                        <FormSubmitError visible={this.state.hasFormErrors} errors={this.state.formErrors}/>
                    </Segment>
                </Form>
            </Grid.Column>
        </Grid>;
    }
}

const ConnectPage = connect(store => {
    return {
        client: store.client,
        provider: store.provider,
        router: store.router
    };
})(Connect);

export default ConnectPage;