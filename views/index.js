import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { makeMainRoutes } from "./routes/routes";
import store from "../store/store";

const routes = makeMainRoutes();

ReactDOM.render(
    <Provider store={store}>{routes}</Provider>,
    document.getElementById("content")
);