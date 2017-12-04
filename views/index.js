import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { ConnectedRouter } from "react-router-redux";
import createHistory from "history/createBrowserHistory";
import AppContainer from "./containers/app.container";

import "semantic-ui-css/semantic.min.css";

import store from "../store/store";

ReactDOM.render(
    <Provider store={store}>
        <ConnectedRouter history={createHistory()}>
            <AppContainer />
        </ConnectedRouter>
    </Provider>,
    document.getElementById("content")
);