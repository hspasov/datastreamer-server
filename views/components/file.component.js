import React from "react";
import PropTypes from "prop-types";
import { Icon, Item } from "semantic-ui-react";

class File extends React.Component {
    render() {
        return (
            <Item>
                {/*<Icon name="file" size="massive" />*/}
                <Item.Content>
                    <Item.Header>{this.props.name}</Item.Header>
                    <Item.Meta>Type: {this.props.type}</Item.Meta>
                        <Item.Meta>Size: {this.props.size}</Item.Meta>
                        <p>Read access: {this.props.access.read.toString()}</p>
                        <p>Write access: {this.props.access.write.toString()}</p>
                        <p>Execute access: {this.props.access.execute.toString()}</p>
                </Item.Content>
            </Item>
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