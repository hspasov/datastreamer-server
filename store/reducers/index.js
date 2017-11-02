import { combineReducers } from "redux";
import { routerReducer } from "react-router-redux";

import client from "./client";
import provider from "./provider";
import sidebar from "./sidebar";

export default combineReducers({
    client,
    provider,
    sidebar,
    router: routerReducer
});