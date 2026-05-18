import { call, put, takeLatest, select } from 'redux-saga/effects';
import { toast } from 'sonner';
import { hrApi } from '../../api/endpoints/hr';

import {
  fetchDepartmentsRequest,
  fetchDepartmentsSuccess,
  departmentsFailure,
  createDepartmentRequest,
  createDepartmentSuccess,
  updateDepartmentRequest,
  updateDepartmentSuccess,
  deleteDepartmentRequest,
  deleteDepartmentSuccess,
} from '../features/departmentsSlice';

function* fetchDepartmentsSaga(action) {
  try {
    const response = yield call(hrApi.getAllDepartments, action.payload);
    if (response.data.success !== false) {
      yield put(fetchDepartmentsSuccess(response.data));
    //   toast.success('Departments loaded');
    } else {
      yield put(departmentsFailure(response.data.message || 'Failed to load departments'));
    }
  } catch (error) {
    yield put(departmentsFailure(error.response?.data?.message || 'Network error'));
  }
}

function* createDepartmentSaga(action) {
  try {
    const response = yield call(hrApi.createDepartment, action.payload);
    if (response.data.success !== false) {
      yield put(createDepartmentSuccess(response.data.data));
      toast.success(`Department "${response.data.data.department.name}" created`);
    } else {
      yield put(departmentsFailure(response.data.message || 'Failed to create department'));
    }
  } catch (error) {
    yield put(departmentsFailure(error.response?.data?.message || 'Network error'));
  }
}

function* updateDepartmentSaga(action) {
  try {
    const { id, ...data } = action.payload;
    const response = yield call(hrApi.updateDepartment, id, data);
    if (response.data.success !== false) {
      yield put(updateDepartmentSuccess(response.data.data));
      toast.success(`Department updated`);
    } else {
      yield put(departmentsFailure(response.data.message || 'Failed to update department'));
    }
  } catch (error) {
    yield put(departmentsFailure(error.response?.data?.message || 'Network error'));
  }
}

function* deleteDepartmentSaga(action) {
  try {
    const response = yield call(hrApi.deleteDepartment, action.payload.id);
    if (response.data.success !== false) {
      yield put(deleteDepartmentSuccess(action.payload.id));
      toast.success('Department deleted');
    } else {
      yield put(departmentsFailure(response.data.message || 'Failed to delete department'));
    }
  } catch (error) {
    yield put(departmentsFailure(error.response?.data?.message || 'Network error'));
  }
}

export default function* departmentsSagas() {
  yield takeLatest(fetchDepartmentsRequest.type, fetchDepartmentsSaga);
  yield takeLatest(createDepartmentRequest.type, createDepartmentSaga);
  yield takeLatest(updateDepartmentRequest.type, updateDepartmentSaga);
  yield takeLatest(deleteDepartmentRequest.type, deleteDepartmentSaga);
}

