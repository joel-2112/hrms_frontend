import { call, put, takeLatest } from 'redux-saga/effects';
import { request } from '../../api/axiosConfig';
import {
  fetchRolesRequest,
  fetchRolesSuccess,
  createRoleRequest,
  createRoleSuccess,
  updateRoleRequest,
  updateRoleSuccess,
  deleteRoleRequest,
  deleteRoleSuccess,
  rolesFailure,
} from '../features/rolesSlice';
import { toast } from 'sonner';

function* fetchRolesSaga(action) {
  try {
    const { page = 1, limit = 5, search, includeDisabled } = action.payload || {};
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (search) params.append('search', search);
    if (includeDisabled !== undefined) params.append('includeDisabled', includeDisabled);
    
    const response = yield call(request, 'get', `/roles?${params.toString()}`);
    
    if (response.data.success) {
      yield put(fetchRolesSuccess({
        data: response.data.data,
        meta: response.data.meta,
      }));
    } else {
      yield put(rolesFailure(response.data.message || 'Failed to fetch roles'));
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error fetching roles';
    yield put(rolesFailure(message));
    toast.error(message);
  }
}

function* createRoleSaga(action) {
  try {
    const response = yield call(request, 'post', '/roles', action.payload);
    
    if (response.data.success) {
      yield put(createRoleSuccess(response.data.data));
      toast.success(`Role "${response.data.data.name}" created`);
    } else {
      yield put(rolesFailure(response.data.message || 'Failed to create role'));
      toast.error(response.data.message || 'Failed to create role');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error creating role';
    yield put(rolesFailure(message));
    toast.error(message);
  }
}

function* updateRoleSaga(action) {
  try {
    const { id, ...data } = action.payload;
    const response = yield call(request, 'put', `/roles/${id}`, data);
    
    if (response.data.success) {
      yield put(updateRoleSuccess(response.data.data));
      toast.success(`Role "${response.data.data.name}" updated`);
    } else {
      yield put(rolesFailure(response.data.message || 'Failed to update role'));
      toast.error(response.data.message || 'Failed to update role');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error updating role';
    yield put(rolesFailure(message));
    toast.error(message);
  }
}

function* deleteRoleSaga(action) {
  try {
    const { id } = action.payload;
    yield call(request, 'delete', `/roles/${id}`);
    yield put(deleteRoleSuccess(id));
    toast.success('Role deleted');
  } catch (error) {
    const message = error.response?.data?.message || 'Network error deleting role';
    yield put(rolesFailure(message));
    toast.error(message);
  }
}

export default function* rolesSagas() {
  yield takeLatest(fetchRolesRequest.type, fetchRolesSaga);
  yield takeLatest(createRoleRequest.type, createRoleSaga);
  yield takeLatest(updateRoleRequest.type, updateRoleSaga);
  yield takeLatest(deleteRoleRequest.type, deleteRoleSaga);
}
