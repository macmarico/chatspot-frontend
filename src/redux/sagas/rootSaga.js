import { all } from 'redux-saga/effects';
import { socketSaga } from './socketSaga';
import { authSaga } from './authSaga';

export default function* rootSaga() {
  yield all([
    socketSaga(),
    authSaga(),
  ]);
}
