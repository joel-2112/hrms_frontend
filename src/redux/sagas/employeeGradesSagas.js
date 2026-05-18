import { call, put, takeLatest } from 'redux-saga/effects';
import { toast } from 'sonner';
import { hrApi } from '../../api/endpoints/hr';
import {
  fetchEmployeeGradesRequest,
  fetchEmployeeGradesSuccess,
  employeeGradesFailure,
  createEmployeeGradeRequest,
  createEmployeeGradeSuccess,
  updateEmployeeGradeRequest,
  updateEmployeeGradeSuccess,
  deleteEmployeeGradeRequest,
  deleteEmployeeGradeSuccess,
} from '../features/employeeGradesSlice';

function* fetchEmployeeGradesSaga(action) {
  try {
    const response = yield call(hrApi.getAllEmployeeGrades, action.payload);
    if (response.data.success !== false) {
      yield put(fetchEmployeeGradesSuccess(response.data));
    } else {
      yield put(employeeGradesFailure(response.data.message || 'Failed to fetch employee grades'));
      toast.error(response.data.message || 'Failed to fetch employee grades');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error fetching employee grades';
    yield put(employeeGradesFailure(message));
    toast.error(message);
  }
}

function* createEmployeeGradeSaga(action) {
  try {
    const response = yield call(hrApi.createEmployeeGrade, action.payload);
    if (response.data.success !== false) {
      yield put(createEmployeeGradeSuccess(response.data.data));
      toast.success('Employee grade created');
    } else {
      yield put(employeeGradesFailure(response.data.message || 'Failed to create employee grade'));
      toast.error(response.data.message || 'Failed to create employee grade');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error creating employee grade';
    yield put(employeeGradesFailure(message));
    toast.error(message);
  }
}

function* updateEmployeeGradeSaga(action) {
  try {
    const { id, ...data } = action.payload;
    const response = yield call(hrApi.updateEmployeeGrade, id, data);
    if (response.data.success !== false) {
      yield put(updateEmployeeGradeSuccess(response.data.data));
      toast.success('Employee grade updated');
    } else {
      yield put(employeeGradesFailure(response.data.message || 'Failed to update employee grade'));
      toast.error(response.data.message || 'Failed to update employee grade');
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Network error updating employee grade';
    yield put(employeeGradesFailure(message));
    toast.error(message);
  }
}

function* deleteEmployeeGradeSaga(action) {
  try {
    const { id } = action.payload;
    yield call(hrApi.deleteEmployeeGrade, id);
    yield put(deleteEmployeeGradeSuccess(id));
    toast.success('Employee grade deleted');
  } catch (error) {
    const message = error.response?.data?.message || 'Network error deleting employee grade';
    yield put(employeeGradesFailure(message));
    toast.error(message);
  }
}

export default function* employeeGradesSagas() {
  yield takeLatest(fetchEmployeeGradesRequest.type, fetchEmployeeGradesSaga);
  yield takeLatest(createEmployeeGradeRequest.type, createEmployeeGradeSaga);
  yield takeLatest(updateEmployeeGradeRequest.type, updateEmployeeGradeSaga);
  yield takeLatest(deleteEmployeeGradeRequest.type, deleteEmployeeGradeSaga);
}
