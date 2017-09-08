import React from "react";
import { Route, Router } from "react-router-dom";
import AppContainer from "../containers/app.container";
import HomePage from "../pages/home.page";
import LoginPage from "../pages/login.page";
import RegisterPage from "../pages/register.page";
import ConnectPage from "../pages/connect.page";

import history from "./history";

export const makeMainRoutes = () => {
    return (
        <Router history={history} component={AppContainer}>
            <div>
                <Route path="/" render={(props) => <AppContainer {...props} />} />
                <Route path="/home" render={(props) => <HomePage {...props} />} />
                <Route path="/login" render={(props) => <LoginPage {...props} />} />
                <Route path="/register" render={(props) => <RegisterPage {...props} />} />
                <Route path="/connect" render={(props) => <ConnectPage {...props} />} />
            </div>
        </Router>
    );
}