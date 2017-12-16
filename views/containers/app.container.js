import React from "react";
import { Divider, Grid, Icon, Image, Menu, Breadcrumb } from "semantic-ui-react";
import { Route } from "react-router-dom";
import { connect } from "react-redux";
import SidebarNavComponent from "../components/sidebarNav";
import { toggleSidebar } from "../../store/actions/sidebar";
import {
    openDirectory,
    navigateBack,
    changePath,
    clearPath
} from "../../store/actions/navigation";

class App extends React.Component {
    constructor(props) {
        super(props);

        this.RTC = null;

        this.toggleSidebar = this.toggleSidebar.bind(this);
    }

    toggleSidebar() {
        this.props.dispatch(toggleSidebar());
    }

    render() {
        const menuColor = (this.props.client.token) ?
            (this.props.provider.token && !this.props.dimmer.error.show) ? "green" : "red" :
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
                        <Menu.Item as={Breadcrumb}>{
                            this.props.navigation.path.map((directory, i) => {
                                return <div>
                                    <Breadcrumb.Section link>Home</Breadcrumb.Section>
                                    <Breadcrumb.Divider />
                                </div>;
                            })
                        }</Menu.Item>
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
        navigation: store.navigation,
        dimmer: store.dimmer,
        router: store.router
    };
})(App);

export default AppContainer;