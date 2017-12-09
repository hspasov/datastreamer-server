import React from "react";
import { Divider, Grid, Icon, Image, Menu, Breadcrumb } from "semantic-ui-react";
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
        const menuColor = (this.props.client.token) ?
            (this.props.provider.token) ? "green" : "red" :
            "blue";
        return <Grid style={{ height: '100%' }}>
                <Grid.Column >
                    <Menu color={menuColor} inverted fluid compact size="massive">
                        <Menu.Item onClick={this.toggleSidebar} as='a' header active={this.props.sidebar.visible}>
                            {/*<Image
                                size='mini'
                                src='/logo.png'
                                style={{ marginRight: '1.5em' }}
                            />*/}
                            <Icon name="list layout" />
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
                    <Route path="/" component={SidebarNavComponent} />
                </Grid.Column>
            </Grid>;
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