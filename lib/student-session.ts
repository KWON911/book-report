import { Student } from './types';

const STORAGE_KEY = 'book-report-student';

export function saveStudent(student: Student): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(student));
  }
}

export function getStudent(): Student | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Student;
  } catch {
    // Corrupted value (extension interference, partial write, tampering) —
    // drop it instead of crashing the page with an uncaught parse error.
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearStudent(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
