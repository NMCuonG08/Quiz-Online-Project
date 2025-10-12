import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NotificationState, NotificationItem } from "@/common/types";

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // Nhận notification từ WebSocket
    notificationReceived: (state, action: PayloadAction<NotificationItem>) => {
      const notification = action.payload;

      // Prevent duplicates
      if (state.items.find((item) => item.id === notification.id)) return;

      state.items.unshift(notification);
      if (!notification.read) {
        state.unreadCount += 1;
      }
    },

    // Tạo notification local
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      state.items.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },

    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(
        (item) => item.id === action.payload
      );
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount -= 1;
      }
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex((item) => item.id === action.payload);
      if (index !== -1) {
        const removed = state.items[index];
        if (!removed.read) {
          state.unreadCount -= 1;
        }
        state.items.splice(index, 1);
      }
    },

    clearAll: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  notificationReceived,
  addNotification,
  markAsRead,
  removeNotification,
  clearAll,
} = notificationSlice.actions;
export default notificationSlice.reducer;
