import { call, put, takeLatest } from 'redux-saga/effects';
import { request } from '../../api/axiosConfig';
import {
  fetchCompaniesRequest,
  fetchCompaniesSuccess,
  createCompanyRequest,
  createCompanySuccess,
  updateCompanyRequest,
  updateCompanySuccess,
  deleteCompanyRequest,
  deleteCompanySuccess,
  companiesFailure,
} from '../features/companiesSlice';
import { toast } from 'sonner';
import { CloudCog } from 'lucide-react';

function* fetchCompaniesSaga() {
  try {
    const response = yield call(request, 'get', '/organizations/companies');
    
    if (response.data.success !== false) {
      yield put(fetchCompaniesSuccess({
        data: response.data.data,
      }));
    } else {
      yield put(companiesFailure(response.data.message || 'Failed to fetch companies'));
      toast.error(response.data.message || 'Failed to fetch companies');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error fetching companies';
    yield put(companiesFailure(message));
    toast.error(message);
  }
}

function* createCompanySaga(action) {
  try {
    const response = yield call(request, 'post', '/organizations/companies', action.payload);
    if (response.data.success !== false) {
      yield put(createCompanySuccess(response.data.data));
      toast.success("Company created");
    } else {
      yield put(companiesFailure(response.data.message || 'Failed to create company'));
      toast.error(response.data.message || 'Failed to create company');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error creating company';
    yield put(companiesFailure(message));
    toast.error(message);
  }
}

function* updateCompanySaga(action) {
  try {
    const { id, ...data } = action.payload;
    const response = yield call(request, 'patch', `/organizations/companies/${id}`, data);
    
    if (response.data.success !== false) {
      yield put(updateCompanySuccess(response.data.data));
      toast.success(`Company "${response.data.data.name}" updated`);
    } else {
      yield put(companiesFailure(response.data.message || 'Failed to update company'));
      toast.error(response.data.message || 'Failed to update company');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error updating company';
    yield put(companiesFailure(message));
    toast.error(message);
  }
}

function* deleteCompanySaga(action) {
  try {
    const { id } = action.payload;
    yield call(request, 'delete', `/organizations/companies/${id}`);
    yield put(deleteCompanySuccess(id));
    toast.success('Company deleted');
  } catch (error) {
    const message = error.response?.data?.message || 'Network error deleting company';
    yield put(companiesFailure(message));
    toast.error(message);
  }
}

export default function* companiesSagas() {
  yield takeLatest(fetchCompaniesRequest.type, fetchCompaniesSaga);
  yield takeLatest(createCompanyRequest.type, createCompanySaga);
  yield takeLatest(updateCompanyRequest.type, updateCompanySaga);
  yield takeLatest(deleteCompanyRequest.type, deleteCompanySaga);
}

