import formurlencoded from "form-urlencoded";

function disconnect() {
    const formData = {
        connectionToken: this.props.provider.token
    };
    fetch("/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formurlencoded(formData)
    }).then(response => {
        this.props.disconnectClient();
    }).catch(error => {
        console.log(error);
    });
}

export default disconnect;