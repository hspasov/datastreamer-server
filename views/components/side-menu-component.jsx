import React from "react";
import { connect } from "react-redux";
import { Grid, Icon, Menu } from "semantic-ui-react";
import { toggleSidebar } from "../../store/actions/sidebar";
import ClientMenuComponent from "./client-menu-component.jsx";
import ConnectionMenuComponent from "./connection-menu-component.jsx";

class SideMenu extends React.Component {
    render() {
        return (this.props.sidebar.visible) ?
            <Menu icon="labeled" vertical inverted borderless fixed="left" style={{ width: "250px" }}>
                <Menu.Item style={{ width: "250px" }} onClick={() => this.props.toggleSidebar()} as="a" header active>
                    <Grid>
                        <Grid.Row centered>
                            <Icon name="list layout" />
                            DataStreamer
                    </Grid.Row>
                    </Grid>
                </Menu.Item>
                <ClientMenuComponent />
                <ConnectionMenuComponent />
            </Menu> : null;
    }
}

const SideMenuComponent = connect(store => {
    return {
        sidebar: store.sidebar
    };
}, { toggleSidebar })(SideMenu);

export default SideMenuComponent;