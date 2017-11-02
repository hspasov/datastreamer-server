import { combineReducers } from "redux";
import { routerReducer } from "react-router-redux";

import client from "./client";
import provider from "./provider";

export default combineReducers({
    client,
    provider,
    router: routerReducer
});