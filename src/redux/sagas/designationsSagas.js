import { call, put, takeLatest } from 'redux-saga/effects';
import { toast } from 'sonner';
import {
  fetchDesignationsRequest,
  fetchDesignationsSuccess,
  createDesignationRequest,
  createDesignationSuccess,
  updateDesignationRequest,
  updateDesignationSuccess,
  deleteDesignationRequest,
  deleteDesignationSuccess,
  designationsFailure,
} from '../features/designationsSlice';
import { hrApi } from '../../api/endpoints/hr';

function* fetchDesignationsSaga(action) {
  try {
    const response = yield call(hrApi.getAllDesignations, action.payload);
    if (response.data.success !== false) {
      yield put(fetchDesignationsSuccess(response.data));
    } else {
      yield put(designationsFailure(response.data.message || 'Failed to fetch designations'));
      toast.error(response.data.message || 'Failed to fetch designations');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error fetching designations';
    yield put(designationsFailure(message));
    toast.error(message);
  }
}

function* createDesignationSaga(action) {
  try {
    const response = yield call(hrApi.createDesignation, action.payload);
    if (response.data.success !== false) {
      yield put(createDesignationSuccess(response.data.data));
      toast.success('Designation created');
    } else {
      yield put(designationsFailure(response.data.message || 'Failed to create designation'));
      toast.error(response.data.message || 'Failed to create designation');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error creating designation';
    yield put(designationsFailure(message));
    toast.error(message);
  }
}

function* updateDesignationSaga(action) {
  try {
    const { id, ...data } = action.payload;
    const response = yield call(hrApi.updateDesignation, id, data);
    if (response.data.success !== false) {
      yield put(updateDesignationSuccess(response.data.data));
      toast.success('Designation updated');
    } else {
      yield put(designationsFailure(response.data.message || 'Failed to update designation'));
      toast.error(response.data.message || 'Failed to update designation');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error updating designation';
    yield put(designationsFailure(message));
    toast.error(message);
  }
}

function* deleteDesignationSaga(action) {
  try {
    const { id } = action.payload;
    const response = yield call(hrApi.deleteDesignation, id);
    if (response.data.success !== false) {
      yield put(deleteDesignationSuccess(id));
      toast.success('Designation deleted');
    } else {
      yield put(designationsFailure(response.data.message || 'Failed to delete designation'));
      toast.error(response.data.message || 'Failed to delete designation');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error deleting designation';
    yield put(designationsFailure(message));
    toast.error(message);
  }
}

export default function* designationsSagas() {
  yield takeLatest(fetchDesignationsRequest.type, fetchDesignationsSaga);
  yield takeLatest(createDesignationRequest.type, createDesignationSaga);
  yield takeLatest(updateDesignationRequest.type, updateDesignationSaga);
  yield takeLatest(deleteDesignationRequest.type, deleteDesignationSaga);
}
