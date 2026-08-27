import { RoomWebSocketGateway } from './room-websocket.gateway';

describe('RoomWebSocketGateway game synchronization', () => {
  const roomId = '11111111-1111-4111-8111-111111111111';
  const userId = '22222222-2222-4222-8222-222222222222';

  function createFixture() {
    const roomEmit = jest.fn();
    const clientEmit = jest.fn();
    const roomService = {
      getRoom: jest.fn().mockResolvedValue({ id: roomId, owner_id: userId }),
      startGame: jest.fn().mockResolvedValue(undefined),
      getNextQuestion: jest.fn().mockResolvedValue({
        questionId: 'question-1',
        timeLimit: 30,
      }),
      persistGameSnapshot: jest.fn().mockResolvedValue(undefined),
      submitAnswer: jest.fn().mockResolvedValue({
        isCorrect: true,
        correctAnswer: 'A',
        points: 1,
      }),
    };
    let storedAnswer: unknown = null;
    const redisService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key.includes(':answered:')) return Promise.resolve(storedAnswer);
        return Promise.resolve(null);
      }),
      set: jest.fn().mockImplementation((key: string, value: unknown) => {
        if (key.includes(':answered:')) storedAnswer = value;
        return Promise.resolve();
      }),
      del: jest.fn().mockResolvedValue(undefined),
      incrementWithTtl: jest.fn().mockResolvedValue(1),
      setIfAbsent: jest
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValue(false),
      hashValuesJson: jest.fn().mockResolvedValue([]),
      hashSetJson: jest.fn().mockResolvedValue(undefined),
    };
    const gateway = new RoomWebSocketGateway(
      roomService as never,
      {} as never,
      redisService as never,
      {} as never,
    );
    Object.assign(gateway, {
      server: { to: jest.fn().mockReturnValue({ emit: roomEmit }) },
    });
    const client = {
      id: 'socket-1',
      user: { user: { id: userId, email: 'user@example.com' } },
      data: { userId },
      emit: clientEmit,
    };
    return {
      gateway,
      roomService,
      redisService,
      roomEmit,
      clientEmit,
      client: client as never,
    };
  }

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('broadcasts start state to the room and initiating owner', async () => {
    jest.useFakeTimers();
    const fixture = createFixture();

    await fixture.gateway.handleStartGame({ roomId }, fixture.client);

    expect(fixture.roomService.startGame).toHaveBeenCalledWith(roomId, userId);
    expect(fixture.roomEmit).toHaveBeenCalledWith(
      'game_state',
      expect.objectContaining({ roomId, status: 'QUESTION' }),
    );
    expect(fixture.clientEmit).toHaveBeenCalledWith(
      'game_state',
      expect.objectContaining({ roomId, status: 'QUESTION' }),
    );
  });

  it('restores personalized score and answered question after reconnect', async () => {
    const fixture = createFixture();
    fixture.redisService.get.mockImplementation((key: string) => {
      if (key.endsWith(':game')) {
        return Promise.resolve({
          roomId,
          status: 'QUESTION',
          questionIndex: 1,
          questionId: 'question-2',
          deadline: Date.now() + 10_000,
          version: 4,
          serverTime: Date.now(),
        });
      }
      if (key.includes(':answered:')) {
        return Promise.resolve({ questionId: 'question-2', points: 1 });
      }
      return Promise.resolve(null);
    });
    fixture.redisService.hashValuesJson.mockResolvedValue([
      {
        userId,
        username: 'User',
        score: 3,
        correctAnswers: 2,
      },
    ]);

    await fixture.gateway.handleGetGameState({ roomId }, fixture.client);

    expect(fixture.clientEmit).toHaveBeenCalledWith(
      'game_state',
      expect.objectContaining({
        roomId,
        version: 4,
        playerScore: 3,
        playerCorrectAnswers: 2,
        answeredQuestionId: 'question-2',
      }),
    );
  });

  it('scores each player only once per question across reconnect commands', async () => {
    const fixture = createFixture();
    const first = {
      roomId,
      questionId: 'question-1',
      selectedOptionId: 'option-1',
      commandId: 'command-1',
    };
    const second = { ...first, commandId: 'command-2' };

    await fixture.gateway.handleSubmitAnswer(first, fixture.client);
    await fixture.gateway.handleSubmitAnswer(second, fixture.client);

    expect(fixture.roomService.submitAnswer).toHaveBeenCalledTimes(1);
    expect(fixture.redisService.setIfAbsent.mock.calls[0][0]).toBe(
      `room:${roomId}:answered:${userId}:question-1`,
    );
    expect(fixture.redisService.setIfAbsent.mock.calls[0][2]).toBe(30);
    expect(fixture.clientEmit).toHaveBeenCalledWith(
      'answer_result',
      expect.objectContaining({ duplicate: true }),
    );
  });
});
