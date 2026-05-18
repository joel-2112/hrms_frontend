import { call, put, takeLatest } from 'redux-saga/effects';
import { toast } from 'sonner';
import { hrApi } from '../../api/endpoints/hr';
import {
  fetchEmploymentTypesRequest,
  fetchEmploymentTypesSuccess,
  employmentTypesFailure,
  createEmploymentTypeRequest,
  createEmploymentTypeSuccess,
  updateEmploymentTypeRequest,
  updateEmploymentTypeSuccess,
  deleteEmploymentTypeRequest,
  deleteEmploymentTypeSuccess,
} from '../features/employmentTypesSlice';

function* fetchEmploymentTypesSaga(action) {
  try {
    const response = yield call(hrApi.getAllEmploymentTypes, action.payload);
    if (response.data.success !== false) {
      yield put(fetchEmploymentTypesSuccess(response.data));
    } else {
      yield put(employmentTypesFailure(response.data.message || 'Failed to fetch employment types'));
      toast.error(response.data.message || 'Failed to fetch employment types');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error fetching employment types';
    yield put(employmentTypesFailure(message));
    toast.error(message);
  }
}

function* createEmploymentTypeSaga(action) {
  try {
    const response = yield call(hrApi.createEmploymentType, action.payload);
    if (response.data.success !== false) {
      yield put(createEmploymentTypeSuccess(response.data.data));
      toast.success('Employment type created');
    } else {
      yield put(employmentTypesFailure(response.data.message || 'Failed to create employment type'));
      toast.error(response.data.message || 'Failed to create employment type');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error creating employment type';
    yield put(employmentTypesFailure(message));
    toast.error(message);
  }
}

function* updateEmploymentTypeSaga(action) {
  try {
    const { id, ...data } = action.payload;
    const response = yield call(hrApi.updateEmploymentType, id, data);
    if (response.data.success !== false) {
      yield put(updateEmploymentTypeSuccess(response.data.data));
      toast.success('Employment type updated');
    } else {
      yield put(employmentTypesFailure(response.data.message || 'Failed to update employment type'));
      toast.error(response.data.message || 'Failed to update employment type');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error updating employment type';
    yield put(employmentTypesFailure(message));
    toast.error(message);
  }
}

function* deleteEmploymentTypeSaga(action) {
  try {
    const { id } = action.payload;
    yield call(hrApi.deleteEmploymentType, id);
    yield put(deleteEmploymentTypeSuccess(id));
    toast.success('Employment type deleted');
  } catch (error) {
    const message = error.response?.data?.message || 'Network error deleting employment type';
    yield put(employmentTypesFailure(message));
    toast.error(message);
  }
}

export default function* employmentTypesSagas() {
  yield takeLatest(fetchEmploymentTypesRequest.type, fetchEmploymentTypesSaga);
  yield takeLatest(createEmploymentTypeRequest.type, createEmploymentTypeSaga);
  yield takeLatest(updateEmploymentTypeRequest.type, updateEmploymentTypeSaga);
  yield takeLatest(deleteEmploymentTypeRequest.type, deleteEmploymentTypeSaga);
}
