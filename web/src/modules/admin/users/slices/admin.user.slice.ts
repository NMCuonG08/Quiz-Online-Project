import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AdminUserService } from "../services/admin.user.service";
import { AdminUserState, User, Role } from "../types";

const initialState: AdminUserState = {
  users: [],
  roles: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk("adminUser/fetchUsers", async () => {
  const response = await AdminUserService.getUsers();
  if (response.success) {
    return response.data;
  }
  throw new Error(response.message || "Failed to fetch users");
});

export const fetchRoles = createAsyncThunk("adminUser/fetchRoles", async () => {
  const response = await AdminUserService.getRoles();
  if (response.success) {
    return response.data;
  }
  throw new Error(response.message || "Failed to fetch roles");
});

export const updateUserRoles = createAsyncThunk(
  "adminUser/updateUserRoles",
  async ({ userId, roleIds }: { userId: string; roleIds: string[] }) => {
    const response = await AdminUserService.updateUserRoles(userId, roleIds);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || "Failed to update roles");
  }
);

const adminUserSlice = createSlice({
  name: "adminUser",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch users";
      })
      // Fetch Roles
      .addCase(fetchRoles.fulfilled, (state, action: PayloadAction<Role[]>) => {
        state.roles = action.payload;
      })
      // Update User Roles
      .addCase(updateUserRoles.fulfilled, (state, action: PayloadAction<User>) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      });
  },
});

export const { clearError } = adminUserSlice.actions;
export default adminUserSlice.reducer;
