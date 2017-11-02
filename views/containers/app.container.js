import React from "react";
import { Divider, Image, Menu, Breadcrumb } from "semantic-ui-react";
import { Route } from "react-router-dom";
import { connect } from "react-redux";
import SidebarNavComponent from "../components/sidebarNav";
import { toggleSidebar } from "../../store/actions/sidebar";

class App extends React.Component {
    constructor(props) {
        super(props);

        this.toggleSidebar = this.toggleSidebar.bind(this);
    }

    toggleSidebar() {
        this.props.dispatch(toggleSidebar());
    }

    render() {
        return (
            <div>
                <Menu color="green" inverted fluid fixed="top">
                    <Menu.Item onClick={this.toggleSidebar} as='a' header active={this.props.sidebar.visible}>
                        {/*<Image
                            size='mini'
                            src='/logo.png'
                            style={{ marginRight: '1.5em' }}
                        />*/}
                        DataStreamer
                    </Menu.Item>
                    <Menu.Item as={Breadcrumb}>
                        <Breadcrumb.Section link>Home</Breadcrumb.Section>
                        <Breadcrumb.Divider />
                        <Breadcrumb.Section link>Store</Breadcrumb.Section>
                        <Breadcrumb.Divider />
                        <Breadcrumb.Section active>T-Shirt</Breadcrumb.Section>
                    </Menu.Item>
                </Menu>
                <Route path="/" component={SidebarNavComponent}/>
            </div>
        );
    }
}

const AppContainer = connect(store => {
    return {
        client: store.client,
        provider: store.provider,
        sidebar: store.sidebar,
        router: store.router
    };
})(App);

export default AppContainer;