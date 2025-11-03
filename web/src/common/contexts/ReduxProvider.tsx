"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store";
import ClientOnly from "./ClientOnly";

// Loading component for PersistGate
const LoadingComponent = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
      <p className="text-white/70">Đang khởi tạo...</p>
    </div>
  </div>
);

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <ClientOnly fallback={children}>
        <PersistGate loading={<LoadingComponent />} persistor={persistor}>
          {children}
        </PersistGate>
      </ClientOnly>
    </Provider>
  );
}
