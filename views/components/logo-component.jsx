import React from "react";
import { connect } from "react-redux";
import { Icon, Menu } from "semantic-ui-react";
import { toggleSidebar } from "../../store/actions/sidebar";

class Logo extends React.Component {
    render() {
        return <Menu.Item onClick={() => this.props.toggleSidebar()} as="a" header active={this.props.sidebar.visible}>
            <Icon name="list layout" />
            DataStreamer
        </Menu.Item>;
    }
}

const LogoComponent = connect(store => {
    return {
        sidebar: store.sidebar
    };
}, { toggleSidebar })(Logo);

export default LogoComponent;