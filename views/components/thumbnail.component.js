import React from "react";
import { Icon, Image } from "semantic-ui-react";

class Thumbnail extends React.Component {
    constructor(props) {
        super(props);

        this.getIcon = this.getIcon.bind(this);
    }

    getIcon() {
        if (/^image\//.test(this.props.mime)) {
            return "file image outline";
        } else if (/^audio\//.test(this.props.mime)) {
            return "file audio outline";
        } else if (/^video\//.test(this.props.mime)) {
            return "file video outline";
        } else if (/^text\//.test(this.props.mime)) {
            return "file text outline";
        } else if (/^inode\/directory/.test(this.props.mime)) {
            return "folder outline";
        } else if (/^application\/pdf/.test(this.props.mime)) {
            return "file pdf outline";
        } else if (/(excel)|(document.spreadsheet)/.test(this.props.mime)) {
            return "file excel outline";
        } else if (/(zip)|(rar)/.test(this.props.mime)) {
            return "file archive outline";
        } else if (/(msword)|(document.text)/.test(this.props.mime)) {
            return "file word outline";
        } else if (/(mspowerpoint)|(document.presentation)/.test(this.props.mime)) {
            return "file powerpoint outline";
        } else {
            return "file outline";
        }
    }

    render() {
        const icon = <Icon onClick={this.props.onClick} name={this.getIcon()} size="massive" />;
        const thumbnail = <Image onClick={this.props.onClick} src={this.props.thumbnail}/>;
        return (this.props.thumbnail) ? thumbnail : icon;
    }
}

export default Thumbnail;