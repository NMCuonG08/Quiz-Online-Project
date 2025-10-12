import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WebSocketState } from "@/common/types";

const initialState: WebSocketState = {
  isConnected: false,
  isConnecting: false,
  error: null,
  reconnectAttempts: 0,
};

const websocketSlice = createSlice({
  name: "websocket",
  initialState,
  reducers: {
    connecting: (state) => {
      state.isConnecting = true;
      state.error = null;
    },
    connected: (state) => {
      state.isConnected = true;
      state.isConnecting = false;
      state.error = null;
      state.reconnectAttempts = 0;
    },
    disconnected: (state, action: PayloadAction<string>) => {
      state.isConnected = false;
      state.isConnecting = false;
      state.error = action.payload;
    },
    connectionError: (state, action: PayloadAction<string>) => {
      state.isConnected = false;
      state.isConnecting = false;
      state.error = action.payload;
    },
    reconnectAttempt: (state) => {
      state.reconnectAttempts += 1;
      state.isConnecting = true;
    },
  },
});

export const {
  connecting,
  connected,
  disconnected,
  connectionError,
  reconnectAttempt,
} = websocketSlice.actions;
export default websocketSlice.reducer;
