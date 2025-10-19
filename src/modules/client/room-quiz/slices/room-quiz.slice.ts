import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  RoomQuizService,
  type RoomQuizData,
  type JoinRoomPayload,
  type ChatMessage,
  type Participant,
} from "../services/room-quiz.service";

interface RoomQuizState {
  data: RoomQuizData | null;
  loading: boolean;
  error: string | null;
  joinLoading: boolean;
  joinError: string | null;
  // Chat state
  messages: ChatMessage[];
  messagesLoading: boolean;
  messagesError: string | null;
  sendMessageLoading: boolean;
  // Participants state
  participants: Participant[];
  participantsLoading: boolean;
  participantsError: string | null;
}

const initialState: RoomQuizState = {
  data: null,
  loading: false,
  error: null,
  joinLoading: false,
  joinError: null,
  // Chat state
  messages: [],
  messagesLoading: false,
  messagesError: null,
  sendMessageLoading: false,
  // Participants state
  participants: [],
  participantsLoading: false,
  participantsError: null,
};

export const fetchRoomById = createAsyncThunk(
  "roomQuiz/fetchById",
  async (roomId: string, { rejectWithValue }) => {
    const response = await RoomQuizService.getRoomById(roomId);
    if (!response.success) {
      return rejectWithValue(response.message || "Failed to fetch room");
    }
    return response.data;
  }
);

export const fetchRoomByCode = createAsyncThunk(
  "roomQuiz/fetchByCode",
  async (roomCode: string, { rejectWithValue }) => {
    const response = await RoomQuizService.getRoomByCode(roomCode);
    if (!response.success) {
      return rejectWithValue(response.message || "Failed to fetch room");
    }
    return response.data;
  }
);

export const joinRoom = createAsyncThunk(
  "roomQuiz/join",
  async (
    { roomId, payload }: { roomId: string; payload: JoinRoomPayload },
    { rejectWithValue }
  ) => {
    const response = await RoomQuizService.joinRoom(roomId, payload);
    if (!response.success) {
      return rejectWithValue(response.message || "Failed to join room");
    }
    return response.data;
  }
);

export const fetchChatMessages = createAsyncThunk(
  "roomQuiz/fetchChatMessages",
  async (roomId: string, { rejectWithValue }) => {
    const response = await RoomQuizService.getChatMessages(roomId);
    if (!response.success) {
      return rejectWithValue(
        response.message || "Failed to fetch chat messages"
      );
    }
    return response.data;
  }
);

export const sendMessage = createAsyncThunk(
  "roomQuiz/sendMessage",
  async (
    { roomId, message }: { roomId: string; message: string },
    { rejectWithValue }
  ) => {
    const response = await RoomQuizService.sendMessage(roomId, message);
    if (!response.success) {
      return rejectWithValue(response.message || "Failed to send message");
    }
    return response.data;
  }
);

export const fetchParticipants = createAsyncThunk(
  "roomQuiz/fetchParticipants",
  async (roomId: string, { rejectWithValue }) => {
    const response = await RoomQuizService.getParticipants(roomId);
    if (!response.success) {
      return rejectWithValue(
        response.message || "Failed to fetch participants"
      );
    }
    return response.data;
  }
);

const roomQuizSlice = createSlice({
  name: "roomQuiz",
  initialState,
  reducers: {
    clearRoomData: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.joinLoading = false;
      state.joinError = null;
      state.messages = [];
      state.messagesLoading = false;
      state.messagesError = null;
      state.sendMessageLoading = false;
      state.participants = [];
      state.participantsLoading = false;
      state.participantsError = null;
    },
    clearJoinError: (state) => {
      state.joinError = null;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action) => {
      state.messages = Array.isArray(action.payload) ? action.payload : [];
    },
    addParticipant: (state, action) => {
      state.participants.push(action.payload);
    },
    removeParticipant: (state, action) => {
      state.participants = state.participants.filter(
        (p) => p.id !== action.payload
      );
    },
    setParticipants: (state, action) => {
      state.participants = Array.isArray(action.payload) ? action.payload : [];
    },
    clearMessagesError: (state) => {
      state.messagesError = null;
    },
    clearParticipantsError: (state) => {
      state.participantsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch room by ID
      .addCase(fetchRoomById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoomById.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchRoomById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch room";
      })
      // Fetch room by code
      .addCase(fetchRoomByCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoomByCode.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchRoomByCode.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch room";
      })
      // Join room
      .addCase(joinRoom.pending, (state) => {
        state.joinLoading = true;
        state.joinError = null;
      })
      .addCase(joinRoom.fulfilled, (state) => {
        state.joinLoading = false;
        state.joinError = null;
      })
      .addCase(joinRoom.rejected, (state, action) => {
        state.joinLoading = false;
        state.joinError = (action.payload as string) || "Failed to join room";
      })
      // Fetch chat messages
      .addCase(fetchChatMessages.pending, (state) => {
        state.messagesLoading = true;
        state.messagesError = null;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages = Array.isArray(action.payload) ? action.payload : [];
        state.messagesError = null;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.messagesError =
          (action.payload as string) || "Failed to fetch chat messages";
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.sendMessageLoading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendMessageLoading = false;
        if (action.payload) {
          state.messages.push(action.payload);
        }
      })
      .addCase(sendMessage.rejected, (state) => {
        state.sendMessageLoading = false;
      })
      // Fetch participants
      .addCase(fetchParticipants.pending, (state) => {
        state.participantsLoading = true;
        state.participantsError = null;
      })
      .addCase(fetchParticipants.fulfilled, (state, action) => {
        state.participantsLoading = false;
        state.participants = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.participantsError = null;
      })
      .addCase(fetchParticipants.rejected, (state, action) => {
        state.participantsLoading = false;
        state.participantsError =
          (action.payload as string) || "Failed to fetch participants";
      });
  },
});

export const {
  clearRoomData,
  clearJoinError,
  addMessage,
  setMessages,
  addParticipant,
  removeParticipant,
  setParticipants,
  clearMessagesError,
  clearParticipantsError,
} = roomQuizSlice.actions;
export default roomQuizSlice.reducer;
