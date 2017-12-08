import React from "react";
import {Message} from "semantic-ui-react";

class FormSubmitError extends React.Component {
    constructor(props) {
        super(props);

        this.errorTypes = {
            "empty": "One or more fields were left empty",
            "validation": "Invalid username or password"
        };
    }

    render() {
        const errorsList = this.props.errors.map(error => this.errorTypes[error]);
        return (<Message
                visible={this.props.visible}
                size="tiny"
                error
                header="There were some errors with your submission"
                list={errorsList}
        />);
    }
}

export default FormSubmitError;