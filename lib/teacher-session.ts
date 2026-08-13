import { createHmac, timingSafeEqual } from 'crypto';

const MAX_SESSION_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours, matches login route's Max-Age=28800

function getSessionSecret(): string {
  const secret = process.env.TEACHER_PASSWORD;
  if (!secret) {
    throw new Error('TEACHER_PASSWORD is not set; cannot sign/verify teacher sessions');
  }
  return secret;
}

export function createTeacherSessionToken(): string {
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', getSessionSecret())
    .update(timestamp)
    .digest('hex');
  return `${timestamp}.${signature}`;
}

export function verifyTeacherSession(req: Request): boolean {
  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return false;
  }

  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/teacher_session=([^;]+)/);
  if (!match) return false;

  const [timestamp, signature] = match[1].split('.');
  if (!timestamp || !signature) return false;

  if (Date.now() - Number(timestamp) > MAX_SESSION_AGE_MS) return false;

  const expectedSignature = createHmac('sha256', secret)
    .update(timestamp)
    .digest('hex');

  const actual = Buffer.from(signature, 'hex');
  const expected = Buffer.from(expectedSignature, 'hex');
  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}
