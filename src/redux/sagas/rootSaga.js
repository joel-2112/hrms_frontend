import { all } from 'redux-saga/effects';
import authSagas from './authSagas';
import rolesSagas from './rolesSagas';
import companiesSagas from './companiesSagas';
import branchesSagas from './branchesSagas';
import departmentsSagas from './departmentsSagas';
import designationsSagas from './designationsSagas';
import employmentTypesSagas from './employmentTypesSagas';
import employeeGradesSagas from './employeeGradesSagas';

export default function* rootSaga() {
  yield all([
    authSagas(),
    rolesSagas(),
    companiesSagas(),
    branchesSagas(),
    departmentsSagas(),
    designationsSagas(),
    employmentTypesSagas(),
    employeeGradesSagas(),
  ]);
}

