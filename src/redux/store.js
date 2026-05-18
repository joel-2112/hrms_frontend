import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer from './features/authSlice';
import permissionsReducer from './features/permissionsSlice';
import uiReducer from './features/uiSlice';
import rolesReducer from './features/rolesSlice';
import companiesReducer from './features/companiesSlice';
import branchesReducer from './features/branchesSlice';
import departmentsReducer from './features/departmentsSlice';
import designationsReducer from './features/designationsSlice';
import employmentTypesReducer from './features/employmentTypesSlice';
import employeeGradesReducer from './features/employeeGradesSlice';

import rootSaga from './sagas/rootSaga';

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    auth: authReducer,
    permissions: permissionsReducer,
    ui: uiReducer,
    roles: rolesReducer,
    companies: companiesReducer,
    branches: branchesReducer,
    departments: departmentsReducer,
    designations: designationsReducer,
    employmentTypes: employmentTypesReducer,
    employeeGrades: employeeGradesReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false,
    }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export { store };

