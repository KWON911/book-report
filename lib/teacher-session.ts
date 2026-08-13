import { createHmac } from 'crypto';

const SESSION_SECRET = process.env.TEACHER_PASSWORD ?? 'insecure-default';

export function createTeacherSessionToken(): string {
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', SESSION_SECRET)
    .update(timestamp)
    .digest('hex');
  return `${timestamp}.${signature}`;
}

export function verifyTeacherSession(req: Request): boolean {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/teacher_session=([^;]+)/);
  if (!match) return false;

  const [timestamp, signature] = match[1].split('.');
  if (!timestamp || !signature) return false;

  const expectedSignature = createHmac('sha256', SESSION_SECRET)
    .update(timestamp)
    .digest('hex');

  return signature === expectedSignature;
}
