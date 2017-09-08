import React from "react";
import { connect } from "react-redux";
import { connectClient } from "../../store/actions/provider";
import formurlencoded from "form-urlencoded";

class Connect extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            name: "",
            password: ""
        }

        this.handleNameChange = this.handleNameChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleNameChange(event) {
        event.preventDefault();
        this.setState({
            name: event.target.value
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
            name: this.state.name,
            password: this.state.password
        }

        fetch("/provider/login", {
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
            this.props.dispatch(connectClient(json));
            this.props.history.replace("/home");
        }).catch(error => {
            console.log(error);
        });
    }

    render() {
        if (!this.props.client.clientId) {
            return (
                <p>Please login or register</p>
            );
        }
        return (
            <div>
                <input type="text" name="name" placeholder="Name: " onChange={this.handleNameChange} />
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