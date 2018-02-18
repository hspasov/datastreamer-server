import React from "react";
import { Breadcrumb, Divider, Grid, Header, Icon, Image, Menu, Segment, Sidebar } from "semantic-ui-react";
import { Link, Route, Switch, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import disconnect from "../../modules/disconnect";
import IndexPage from "../pages/index-page.jsx";
import HomePage from "../pages/home-page.jsx";
import LoginPage from "../pages/login-page.jsx";
import RegisterPage from "../pages/register-page.jsx";
import ConnectPage from "../pages/connect-page.jsx";
import AccountSettingsPage from "../pages/account-settings-page.jsx";
import SideMenuComponent from "../components/side-menu-component.jsx";
import LogoComponent from "../components/logo-component.jsx";
import {
    openDirectory,
    navigateBack,
    changePath,
    clearPath
} from "../../store/actions/navigation";

class App extends React.Component {
    constructor(props) {
        super(props);

        this.disconnect = disconnect.bind(this);
    }

    render() {
        const location = (this.props.location.pathname === "/login") ? "Login" :
                (this.props.location.pathname === "/register") ? "Register" :
                (this.props.location.pathname === "/connect") ? "Connect" :
                (this.props.location.pathname === "/settings") ? "Settings" : "Index";

        const topMenu = <Menu color="blue" inverted fluid size="massive" fixed="top">
            <LogoComponent />
            <Menu.Item>{location}</Menu.Item>
        </Menu>

        return <div style={this.props.sidebar.visible ? { height: "100%", marginLeft: "250px" } : { height: "100%" }}>
            <SideMenuComponent />
            <Route render={({ location }) => { return location.pathname === "/home" ? <div></div> : topMenu }} />
            <Switch>
                <Route path="/" exact component={IndexPage} />
                <Route path="/home" component={HomePage} />
                <Route path="/login" component={LoginPage} />
                <Route path="/register" component={RegisterPage} />
                <Route path="/connect" component={ConnectPage} />
                <Route path="/settings" component={AccountSettingsPage} />
            </Switch>
        </div>;
    }
}

const AppContainer = withRouter(connect(store => {
    return {
        client: store.client,
        provider: store.provider,
        sidebar: store.sidebar
    };
})(App));

export default AppContainer;