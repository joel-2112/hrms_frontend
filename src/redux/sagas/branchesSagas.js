import { call, put, takeLatest } from 'redux-saga/effects';
import { request } from '../../api/axiosConfig';
import {
  fetchBranchesRequest,
  fetchBranchesSuccess,
  createBranchRequest,
  createBranchSuccess,
  updateBranchRequest,
  updateBranchSuccess,
  deleteBranchRequest,
  deleteBranchSuccess,
  branchesFailure,
} from '../features/branchesSlice';
import { toast } from 'sonner';

function* fetchBranchesSaga(action) {
  try {
    const { companyId } = action.payload || {};
    const response = yield call(request, 'get', '/organizations/branches', { params: { companyId } });
    
    if (response.data.success !== false) {
      yield put(fetchBranchesSuccess(response.data));
    } else {
      yield put(branchesFailure(response.data.message || 'Failed to fetch branches'));
      toast.error(response.data.message || 'Failed to fetch branches');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error fetching branches';
    yield put(branchesFailure(message));
    toast.error(message);
  }
}


function* createBranchSaga(action) {
  try {
    const response = yield call(request, 'post', '/organizations/branches', action.payload);
    
    if (response.data.success !== false) {
      yield put(createBranchSuccess(response.data.data));
      toast.success(`Branch "${response.data.data.name}" created`);
    } else {
      yield put(branchesFailure(response.data.message || 'Failed to create branch'));
      toast.error(response.data.message || 'Failed to create branch');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error creating branch';
    yield put(branchesFailure(message));
    toast.error(message);
  }
}

function* updateBranchSaga(action) {
  try {
    const { id, ...data } = action.payload;
    const response = yield call(request, 'put', `/organizations/branches/${id}`, data);
    
    if (response.data.success !== false) {
      yield put(updateBranchSuccess(response.data.data));
      toast.success(`Branch "${response.data.data.name}" updated`);
    } else {
      yield put(branchesFailure(response.data.message || 'Failed to update branch'));
      toast.error(response.data.message || 'Failed to update branch');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error updating branch';
    yield put(branchesFailure(message));
    toast.error(message);
  }
}

function* deleteBranchSaga(action) {
  try {
    const { id } = action.payload;
    yield call(request, 'delete', `/organizations/branches/${id}`);
    yield put(deleteBranchSuccess(id));
    toast.success('Branch deleted');
  } catch (error) {
    const message = error.response?.data?.message || 'Network error deleting branch';
    yield put(branchesFailure(message));
    toast.error(message);
  }
}

export default function* branchesSagas() {
  yield takeLatest(fetchBranchesRequest.type, fetchBranchesSaga);
  yield takeLatest(createBranchRequest.type, createBranchSaga);
  yield takeLatest(updateBranchRequest.type, updateBranchSaga);
  yield takeLatest(deleteBranchRequest.type, deleteBranchSaga);
}

