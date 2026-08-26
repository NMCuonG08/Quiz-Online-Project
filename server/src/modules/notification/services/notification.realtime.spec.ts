import { NotificationService } from './notification.service';

describe('NotificationService realtime contract', () => {
  it('emits a complete timestamped notification payload', () => {
    const clientSend = jest.fn();
    const service = Object.create(
      NotificationService.prototype,
    ) as NotificationService;
    Object.assign(service as unknown as Record<string, unknown>, {
      eventRepository: { clientSend },
    });

    service.notificationForUser({
      userId: 'user-1',
      title: 'Tạo phòng thành công',
      type: 'success',
      message: 'Room created: 123456',
    });

    const [event, room, payload] = clientSend.mock.calls[0];
    expect(event).toBe('notification');
    expect(room).toBe('user-1');
    expect(payload).toMatchObject({
      type: 'success',
      title: 'Tạo phòng thành công',
      message: 'Room created: 123456',
      userId: 'user-1',
      read: false,
    });
    expect(Number.isNaN(Date.parse(payload.timestamp))).toBe(false);
    expect(typeof payload.id).toBe('string');
  });
});
