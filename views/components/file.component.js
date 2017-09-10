import React from "react";
import PropTypes from "prop-types";

class File extends React.Component {
    render() {
        return (
            <div>
                <p>File name: {this.props.name}</p>
                <p>Type: {this.props.type}</p>
                <p>Size: {this.props.size}</p>
                <p>Read access: {this.props.access.read.toString()}</p>
                <p>Write access: {this.props.access.write.toString()}</p>
                <p>Execute access: {this.props.access.execute.toString()}</p>
            </div>
        );
    }
}

File.propTypes = {
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    access: PropTypes.shape({
        read: PropTypes.bool.isRequired,
        write: PropTypes.bool.isRequired,
        execute: PropTypes.bool.isRequired
    })
};

export default File;