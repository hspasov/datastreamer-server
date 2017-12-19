import React from "react";
import { Divider, Grid, Icon, Image, Menu, Breadcrumb } from "semantic-ui-react";
import { Route } from "react-router-dom";
import { connect } from "react-redux";
import SidebarNavComponent from "../components/sidebarNav";
import {
    openDirectory,
    navigateBack,
    changePath,
    clearPath
} from "../../store/actions/navigation";

class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <Grid style={{ height: '100%' }}>
                <Grid.Column >
                    <Route path="/" component={SidebarNavComponent}/>
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