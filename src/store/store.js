import { combineReducers, applyMiddleware, createStore } from "redux";
import { routerMiddleware } from "react-router-redux";
import createHistory from "history/createBrowserHistory";
import reducer from "./reducers";
import { loadState, saveState } from "./actions/localStorage.js";

const persistedState = loadState();
const store = createStore(reducer, persistedState);

store.subscribe(() => {
    saveState(store.getState());
});

export {
    store
};