import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "@/lib/storage";
import rootReducer from "./rootReducer";
import { websocketMiddleware } from "@/common/middlewares/websocket.middleware";
// Main persist config - auth persistence is handled in rootReducer
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "quiz", "question", "category", "quizPlay"], // Persist these slices
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(websocketMiddleware.middleware),
});

// Register store globally for API client access
if (typeof window !== "undefined") {
  interface WindowWithStore extends Window {
    __STORE__?: typeof store;
  }
  (window as WindowWithStore).__STORE__ = store;
}

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
