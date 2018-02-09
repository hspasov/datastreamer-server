import React from "react";
import { Redirect } from "react-router";
import { Helmet } from "react-helmet";
import { Button, Grid, Segment } from "semantic-ui-react";
import ChangePasswordComponent from "../components/change-password-component.jsx";
import DeleteAccountComponent from "../components/delete-account-component.jsx";

class AccountSettingsPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showDeleteAccount: false,
        };
    }

    setShowDeleteAccount(show) {
        this.setState({
            showDeleteAccount: show
        });
    }

    render() {
        if (!this.props.client.token) {
            return <Redirect to="/login"></Redirect>;
        }

        return <Segment className="accountSettingsPage">
            <Helmet><style>{`
      body > div,
      body > div > div,
      body > div > div > div.accountSettingsPage {
        height: 100%;
      }
    `}</style></Helmet>
            <Grid textAlign="center" style={{ height: "100%" }} verticalAlign="middle">
                <Grid.Column style={{ maxWidth: 450 }}>
                    {(this.state.showDeleteAccount) ?
                        <DeleteAccountComponent /> : <ChangePasswordComponent />
                    }
                    <Button onClick={() => this.setShowDeleteAccount(!this.state.showDeleteAccount)}>
                        {this.state.showDeleteAccount ?
                            "Change account password" : "Delete account"
                        }
                    </Button>
                </Grid.Column>
            </Grid>
        </Segment>;
    }
}

export default AccountSettingsPage;