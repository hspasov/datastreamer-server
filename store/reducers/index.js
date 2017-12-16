import { combineReducers } from "redux";
import { routerReducer } from "react-router-redux";

import client from "./client";
import provider from "./provider";
import sidebar from "./sidebar";
import navigation from "./navigation";
import dimmer from "./dimmer";
import files from "./files";

export default combineReducers({
    client,
    provider,
    sidebar,
    navigation,
    dimmer,
    files,
    router: routerReducer
});