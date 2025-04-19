import { all } from 'redux-saga/effects';
import { socketSaga } from './socketSaga';

export default function* rootSaga() {
  yield all([
    socketSaga(),
    // Add other sagas here
  ]);
}
