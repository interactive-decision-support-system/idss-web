import type { UserLocation } from '@/types/chat';

describe('IDSSApiService.sendMessage', () => {
  beforeEach(() => {
    jest.resetModules();
    (global as unknown as { fetch?: unknown }).fetch = jest.fn();
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('includes user_location in request body when provided', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ response_type: 'question', message: 'ok', session_id: 's1' }),
    });

    const { idssApiService } = await import('@/services/api');

    const loc: UserLocation = {
      latitude: 37.42,
      longitude: -122.17,
      accuracy_m: 12,
      captured_at: '2026-01-27T00:00:00.000Z',
    };

    await idssApiService.sendMessage('hello', 'sid-123', loc);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/chat');
    expect(init).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual(
      expect.objectContaining({
        message: 'hello',
        session_id: 'sid-123',
        user_location: loc,
      }),
    );
  });

  it('omits user_location when not provided', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ response_type: 'question', message: 'ok', session_id: 's1' }),
    });

    const { idssApiService } = await import('@/services/api');

    await idssApiService.sendMessage('hello', 'sid-123');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual(
      expect.objectContaining({
        message: 'hello',
        session_id: 'sid-123',
      }),
    );
    expect(body).not.toHaveProperty('user_location');
  });
});

