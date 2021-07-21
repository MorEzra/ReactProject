import socketIOClient from 'socket.io-client'
import { ActionType } from './action-type';
import { AppState } from './app-state';
import { Action } from './action';

export function reduce(oldAppState: AppState, action: Action): AppState {
    const newAppState = { ...oldAppState }
    switch (action.type) {
        case ActionType.updateIsUserLoggedIn:
            newAppState.isUserLoggedIn = !newAppState.isUserLoggedIn;
            break;

        case ActionType.registerToSocketsIO:
            newAppState.socket = socketIOClient('http://localhost:3002', { query: 'token=' + action.payload }).connect();
            break;
    }

    return newAppState;
}