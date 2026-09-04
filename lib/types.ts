export interface Student {
  id: string;
  name: string;
  class_id: string;
  number: number;
}

export interface BookReport {
  id: string;
  student_id: string;
  title: string;
  author: string | null;
  categories: string[] | null;
  content: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  teacher_comment: string | null;
  created_at: string;
  submitted_at: string | null;
}

export interface TeacherBookReport extends BookReport {
  student: { id: string; name: string; number: number; class: { name: string } };
}
