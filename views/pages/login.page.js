import React from "react";
import { connect } from "react-redux";
import { push } from "react-router-redux";
import { loginClient } from "../../store/actions/client";
import formurlencoded from "form-urlencoded";

class Login extends React.Component {
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
        });
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
            password: this.state.password
        }

        fetch("/login", {
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
            this.props.dispatch(loginClient(json));
            this.props.history.push("/connect");
        }).catch(error => {
            console.log(error);
        });
    }

    render() {
        return (
            <div>
                <input type="text" name="username" placeholder="Username: " onChange={this.handleUsernameChange} />
                <input type="password" name="password" placeholder="Password: " onChange={this.handlePasswordChange} />
                <button onClick={this.handleSubmit}>Log in</button>
            </div>
        );
    }
}

const LoginPage = connect(store => {
    return {
        client: store.client,
        router: store.router
    };
})(Login);

export default LoginPage;