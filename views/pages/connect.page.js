import React from "react";
import { connect } from "react-redux";
import { connectClient } from "../../store/actions/provider";
import formurlencoded from "form-urlencoded";
import AppContainer from "../containers/app.container";

class Connect extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: "",
            password: ""
        }

        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
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
                throw `Authentication failed\n${response}`;
            }
        }).then(json => {
            this.props.dispatch(connectClient(json));
            this.props.history.replace("/home");
        }).catch(error => {
            console.log(error);
        });
    }

    render() {
        if (!this.props.client.token) {
            return (
                <p>Please login or register</p>
            );
        }
        return (
            <div>
                <input type="text" name="name" placeholder="Name: " onChange={this.handleUsernameChange} />
                <input type="password" name="password" placeholder="Password: " onChange={this.handlePasswordChange} />
                <button onClick={this.handleSubmit}>Log in</button>
            </div>
        );
    }
}

const ConnectPage = connect(store => {
    return {
        client: store.client,
        provider: store.provider
    };
})(Connect);

export default ConnectPage;