import { AppState } from './app-state';
import { reduce } from './reducer';
import { createStore } from 'redux';

export const store = createStore(reduce, new AppState());