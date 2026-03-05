/** @jest-environment node */

/**
 * Tests for GET /api/skill
 *
 * Verifies the OpenClaw skill file is served correctly with the right
 * content type, headers, and substituted API URL.
 */

describe('GET /api/skill — OpenClaw skill endpoint', () => {
  const DEFAULT_API_URL = 'https://idss-backend.onrender.com';

  beforeEach(() => {
    jest.resetModules();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  // ── Response shape ─────────────────────────────────────────────────────────

  it('returns HTTP 200', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    expect((res as unknown as Response).status).toBe(200);
  });

  it('sets Content-Type to application/javascript', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const ct = (res as unknown as Response).headers.get('Content-Type') || '';
    expect(ct).toMatch(/application\/javascript/);
  });

  it('sets Content-Disposition to attachment with filename idss-shopping.js', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const cd = (res as unknown as Response).headers.get('Content-Disposition') || '';
    expect(cd).toContain('attachment');
    expect(cd).toContain('idss-shopping.js');
  });

  it('sets Cache-Control header', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const cc = (res as unknown as Response).headers.get('Cache-Control') || '';
    expect(cc).toBeTruthy();
  });

  // ── API URL substitution ───────────────────────────────────────────────────

  it('embeds the default backend URL when env var is not set', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const text = await (res as unknown as Response).text();
    expect(text).toContain(`const IDSS_API_URL = '${DEFAULT_API_URL}'`);
  });

  it('embeds NEXT_PUBLIC_API_BASE_URL when set', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://my-custom-backend.example.com';
    const { GET } = await import('./route');
    const res = await GET();
    const text = await (res as unknown as Response).text();
    expect(text).toContain("const IDSS_API_URL = 'https://my-custom-backend.example.com'");
    expect(text).not.toContain(DEFAULT_API_URL);
  });

  // ── Skill content correctness ─────────────────────────────────────────────

  it('exports a default skill object', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const text = await (res as unknown as Response).text();
    expect(text).toContain('export default {');
  });

  it('declares the correct skill name', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const text = await (res as unknown as Response).text();
    expect(text).toContain("name: 'IDSS Shopping Assistant'");
  });

  it('declares a version field', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const text = await (res as unknown as Response).text();
    expect(text).toMatch(/version:\s*['"][0-9]+\.[0-9]+\.[0-9]+['"]/);
  });

  it('includes shopping triggers', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const text = await (res as unknown as Response).text();
    expect(text).toContain('laptop');
    expect(text).toContain('find me');
    expect(text).toContain('ebay');
  });

  it('calls /chat-text endpoint', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const text = await (res as unknown as Response).text();
    expect(text).toContain('/chat-text');
  });

  it('calls /search/ebay endpoint', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const text = await (res as unknown as Response).text();
    expect(text).toContain('/search/ebay');
  });

  it('requests memory and network permissions', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const text = await (res as unknown as Response).text();
    expect(text).toContain('network');
    expect(text).toContain('memory');
  });

  it('includes an onReset handler', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const text = await (res as unknown as Response).text();
    expect(text).toContain('onReset');
  });

  it('includes the eBay URL fallback function', async () => {
    const { GET } = await import('./route');
    const res = await GET();
    const text = await (res as unknown as Response).text();
    expect(text).toContain('ebay.com/sch/i.html');
  });

  it('includes NEXT_PUBLIC_SITE_URL in install comment when set', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://mysite.example.com';
    const { GET } = await import('./route');
    const res = await GET();
    const text = await (res as unknown as Response).text();
    expect(text).toContain('https://mysite.example.com');
  });
});
