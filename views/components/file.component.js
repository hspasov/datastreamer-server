import React from "react";

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

module.exports = File;