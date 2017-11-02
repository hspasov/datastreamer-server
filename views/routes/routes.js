import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Sidebar, Segment, Menu } from "semantic-ui-react";
import { ConnectedRouter } from "react-router-redux";
import AppContainer from "../containers/app.container";

import history from "./history";

export const makeMainRoutes = () => {
    return (
        <ConnectedRouter history={history}>
            <AppContainer/>
        </ConnectedRouter>
    );
}