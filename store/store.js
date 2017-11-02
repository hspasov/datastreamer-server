import { combineReducers, applyMiddleware, createStore } from "redux";
import { routerMiddleware } from "react-router-redux";
import history from "../views/routes/history";
import reducer from "./reducers";
import { loadState, saveState } from "./actions/localStorage.js";

const persistedState = loadState();
const store = createStore(reducer, persistedState, applyMiddleware(routerMiddleware(history)));

store.subscribe(() => {
    saveState(store.getState());
});

export default store;