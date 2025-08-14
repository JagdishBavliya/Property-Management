import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import rolesReducer from './slices/rolesSlice';
import brokeragesReducer from './slices/brokeragesSlice';
import propertiesReducer from './slices/propertiesSlice';
import notificationsReducer from './slices/notificationsSlice';
import dashboardReducer from './slices/dashboardSlice';
import estimatesReducer from './slices/estimatesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    roles: rolesReducer,
    brokerages: brokeragesReducer,
    properties: propertiesReducer,
    notifications: notificationsReducer,
    dashboard: dashboardReducer,
    estimates: estimatesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['some.path.to.ignore'],
      },
    }),
}); 