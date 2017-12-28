import { combineReducers } from "redux";
import { routerReducer } from "react-router-redux";

import client from "./client";
import provider from "./provider";
import sidebar from "./sidebar";
import navigation from "./navigation";
import dimmer from "./dimmer";
import files from "./files";
import imageViewer from "./image-viewer";
import textViewer from "./text-viewer";
import selection from "./selection";

export default combineReducers({
    client,
    provider,
    sidebar,
    navigation,
    dimmer,
    files,
    imageViewer,
    textViewer,
    selection,
    router: routerReducer
});