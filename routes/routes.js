import React from "react";
import { Route, Router } from "react-router-dom";
import AppContainer from "../views/containers/app.container";
import HomePage from "../views/pages/home.page";
import LoginPage from "../views/pages/login.page";
import RegisterPage from "../views/pages/register.page";

import history from "./history";

export const makeMainRoutes = () => {
    return (
        <Router history={history} component={AppContainer}>
            <div>
                <Route path="/" render={(props) => <AppContainer {...props} />} />
                <Route path="/home" render={(props) => <HomePage {...props} />} />
                <Route path="/login" render={(props) => <LoginPage {...props} />} />
                <Route path="/register" render={(props) => <RegisterPage {...props} />} />
            </div>
        </Router>
    );
}