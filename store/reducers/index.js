import { combineReducers } from "redux";

import client from "./client";
import provider from "./provider";

export default combineReducers({
    client,
    provider
});