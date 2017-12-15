import React from "react";
import { Icon, Image } from "semantic-ui-react";

class Thumbnail extends React.Component {
    constructor(props) {
        super(props);

        this.getIcon = this.getIcon.bind(this);
    }

    getIcon() {
        switch (this.props.mime) {
            default:
                return "file";
        }
    }

    render() {
        const icon = <Icon onClick={this.props.onClick} name={this.getIcon()} size="massive" />;
        const thumbnail = <Image onClick={this.props.onClick} src={this.props.thumbnail}/>;
        return (this.props.thumbnail) ? thumbnail : icon;
    }
}

export default Thumbnail;