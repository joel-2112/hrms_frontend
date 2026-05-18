 import { call, put, takeLatest } from 'redux-saga/effects';
import { request } from '../../api/axiosConfig';
import { 
  loginRequest, 
  loginSuccess, 
  loginFailure,
  initMeRequest,
  initMeSuccess,
  initMeFailure
} from '../features/authSlice';
import { setPermissions } from '../features/permissionsSlice';

function* loginSaga(action) {
  try {
    const { email, password } = action.payload;
    const response = yield call(request, 'post', '/auth/login', { email, password });
    
    if (!response.data.success) {
      yield put(loginFailure(response.data.message || 'Login failed'));
      return;
    }
    
    // Login sets cookie
    // Step 2: Get user profile
    const userRes = yield call(request, 'get', '/auth/me');
    const loginUser = userRes.data.data;
    
    // Step 3: Get effective permissions 
    const permsRes = yield call(request, 'get', `/roles/users/${loginUser.id}/effective-permissions`);
    
    yield put(setPermissions(permsRes.data.data));
    
    yield put(loginSuccess(loginUser));
  localStorage.setItem('erp_user', JSON.stringify(loginUser));
  } catch (error) {

    yield put(loginFailure(error.response?.data?.message || 'Network error'));
  }
}

export function* initMeSaga() {
  try {
    const response = yield call(request, 'get', '/auth/me');
    if (!response.data.success) {
      yield put(initMeFailure(response.data.message || 'Session check failed'));
      return;
    }

    const initUser = response.data.data;

    // Get effective permissions
    const permsRes = yield call(request, 'get', `/roles/users/${initUser.id}/effective-permissions`);
    yield put(setPermissions(permsRes.data.data));

    yield put(initMeSuccess(initUser));
    localStorage.setItem('erp_user', JSON.stringify(initUser));
  } catch (error) {
    yield put(initMeFailure(error.response?.data?.message || 'Network error'));
  }
}

export default function* authSagas() {
  yield takeLatest(loginRequest.type, loginSaga);
  yield takeLatest(initMeRequest.type, initMeSaga);
}

