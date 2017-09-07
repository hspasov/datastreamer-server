import React from "react";
import { connect } from "react-redux";
import { loginClient } from "../../store/actions/client";
import formurlencoded from "form-urlencoded";

class Login extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            email: "",
            password: ""
        }

        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleEmailChange(event) {
        event.preventDefault();
        this.setState({
            email: event.target.value
        })
    }

    handlePasswordChange(event) {
        event.preventDefault();
        this.setState({
            password: event.target.value
        });
    }

    handleSubmit() {
        let formData = {
            email: this.state.email,
            password: this.state.password
        }

        fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", },
            body: formurlencoded(formData)
        }).then(response => {
            if (response.status == 409) {
                throw "Authentication failed";
            } else {
                return response.json();
            }
        }).then(json => {
            this.props.dispatch(loginClient(json));
            this.props.history.replace("/home");
        }).catch(error => {
            console.log(error);
        });
    }

    render() {
        return (
            <div>
                <input type="email" name="email" placeholder="Email: " onChange={this.handleEmailChange} />
                <input type="password" name="password" placeholder="Password: " onChange={this.handlePasswordChange} />
                <button onClick={this.handleSubmit}>Log in</button>
            </div>
        );
    }
}

const LoginPage = connect(store => {
    return {
        client: store.client
    };
})(Login);

export default LoginPage;