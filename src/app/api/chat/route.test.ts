/** @jest-environment node */

describe('/api/chat route proxy', () => {
  beforeEach(() => {
    jest.resetModules();
    (global as unknown as { fetch?: unknown }).fetch = jest.fn();
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://backend.test';
  });

  it('forwards user_location to backend', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ response_type: 'question', message: 'ok', session_id: 's1' }),
    });

    const { POST } = await import('./route');

    const reqBody = {
      message: 'hello',
      session_id: 'sid-1',
      user_location: { latitude: 1, longitude: 2, accuracy_m: 5, captured_at: '2026-01-27T00:00:00.000Z' },
    };

    const res = await POST({ json: async () => reqBody } as unknown as never);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://backend.test/chat');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual(expect.objectContaining(reqBody));

    const data = await (res as unknown as Response).json();
    expect(data).toEqual(expect.objectContaining({ message: 'ok', session_id: 's1' }));
  });

  it('returns 400 when message is missing', async () => {
    const { POST } = await import('./route');
    const res = await POST({ json: async () => ({ session_id: 'x' }) } as unknown as never);

    expect((res as unknown as Response).status).toBe(400);
    const data = await (res as unknown as Response).json();
    expect(data).toEqual(expect.objectContaining({ error: 'Message is required' }));
  });
});

