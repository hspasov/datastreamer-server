import React from "react";
import { connect } from "react-redux";
import { Helmet } from "react-helmet";
import { Button, Form, Grid, Header, Segment } from "semantic-ui-react";
import formurlencoded from "form-urlencoded";
import FormSubmitError from "../components/form-submit-error";
import { loginClient, logoutClient } from "../../store/actions/client";
import { disconnectClient } from "../../store/actions/provider";

class Settings extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            oldPassword: "",
            newPassword: "",
            confirmNewPassword: "",
            deleteAccountPassword: "",
            showDeleteAccount: false,
            hasFormErrors: false,
            formErrors: []
        };

        this.handleChangePasswordSubmit = this.handleChangePasswordSubmit.bind(this);
        this.handleOldPasswordChange = this.handleOldPasswordChange.bind(this);
        this.handleNewPasswordChange = this.handleNewPasswordChange.bind(this);
        this.handleConfirmNewPasswordChange = this.handleConfirmNewPasswordChange.bind(this);
        this.handleDeleteAccountPasswordChange = this.handleDeleteAccountPasswordChange.bind(this);
        this.handleDeleteAccount = this.handleDeleteAccount.bind(this);
        this.setShowDeleteAccount = this.setShowDeleteAccount.bind(this);
    }

    handleChangePasswordSubmit() {
        if (!(this.state.oldPassword &&
            this.state.newPassword &&
            this.state.confirmNewPassword)) {

            this.setState({
                hasFormErrors: true,
                formErrors: ["empty"]
            });
            return;
        } else if (this.state.newPassword !== this.state.confirmNewPassword) {
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
            oldPassword: this.state.oldPassword,
            newPassword: this.state.newPassword
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

    handleDeleteAccount() {
        if (!this.state.deleteAccountPassword) {
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
            password: this.state.deleteAccountPassword
        };
        fetch("/delete", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formurlencoded(formData)
        }).then(response => {
            if (response.status === 200) {
                this.props.disconnectClient();
                this.props.logoutClient();
            } else {
                throw response.status;
            }
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

    handleOldPasswordChange(event) {
        event.preventDefault();
        this.setState({
            oldPassword: event.target.value
        });
    }

    handleNewPasswordChange(event) {
        event.preventDefault();
        this.setState({
            newPassword: event.target.value
        });
    }

    handleConfirmNewPasswordChange(event) {
        event.preventDefault();
        this.setState({
            confirmNewPassword: event.target.value
        });
    }

    handleDeleteAccountPasswordChange(event) {
        event.preventDefault();
        this.setState({
            deleteAccountPassword: event.target.value
        });
    }

    setShowDeleteAccount(show) {
        if (show) {
            this.setState({
                oldPassword: "",
                newPassword: "",
                confirmNewPassword: ""
            });
        } else {
            this.setState({
                deleteAccountPassword: ""
            })
        }
        this.setState({
            showDeleteAccount: show
        });
    }

    render() {
        const deleteAccount = <Segment>
            <Header as="h2" color="black" textAlign="center">
                Delete account
            </Header>
            <Form size="massive">
                <Segment>
                    <Form.Input
                        fluid
                        icon="lock"
                        iconPosition="left"
                        placeholder="Password"
                        type="password"
                        required
                        error
                        onChange={this.handleDeleteAccountPasswordChange}
                    />
                    <Button color="red" fluid size="large" onClick={this.handleDeleteAccount}>DELETE</Button>
                    <FormSubmitError visible={this.state.hasFormErrors} errors={this.state.formErrors} />
                </Segment>
            </Form>
            <Button onClick={() => this.setShowDeleteAccount(false)}>Go back</Button>
        </Segment>;

        const changePassword = <Segment>
            <Header as="h2" color="black" textAlign="center">
                Change password
            </Header>
            <Form size="massive">
                <Segment>
                    <Form.Input
                        fluid
                        icon="lock"
                        iconPosition="left"
                        placeholder="Old password"
                        type="password"
                        required
                        onChange={this.handleOldPasswordChange}
                    />
                    <Form.Input
                        fluid
                        icon="lock"
                        iconPosition="left"
                        placeholder="New password"
                        type="password"
                        required
                        onChange={this.handleNewPasswordChange}
                    />
                    <Form.Input
                        fluid
                        icon="lock"
                        iconPosition="left"
                        placeholder="Confirm new password"
                        type="password"
                        required
                        onChange={this.handleConfirmNewPasswordChange}
                    />
                    <Button color="black" fluid size="large" onClick={this.handleChangePasswordSubmit}>Submit</Button>
                    <FormSubmitError visible={this.state.hasFormErrors} errors={this.state.formErrors} />
                </Segment>
            </Form>
            <Button onClick={() => this.setShowDeleteAccount(true)}>Delete account</Button>
        </Segment>;

        return <Segment className="settingsPage">
            <Helmet><style>{`
      body > div,
      body > div > div,
      body > div > div > div.settingsPage {
        height: 100%;
      }
    `}</style></Helmet>
            <Grid textAlign="center" style={{ height: "100%" }} verticalAlign="middle">
                <Grid.Column style={{ maxWidth: 450 }}>
                    {(this.state.showDeleteAccount)? deleteAccount : changePassword}
                </Grid.Column>
            </Grid>
        </Segment>;
    }
}

const SettingsPage = connect(store => {
    return {
        client: store.client
    };
}, { loginClient, disconnectClient, logoutClient })(Settings);

export default SettingsPage;