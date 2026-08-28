import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

const UNIQUE_VIOLATION = '23505';

export async function POST(req: Request) {
  const body = await req.json();
  const { class_id, number } = body;
  const name = typeof body.name === 'string' ? body.name.trim() : body.name;

  const numberMissing =
    number === undefined || number === null || Number.isNaN(number);

  if (!name || !class_id || numberMissing) {
    return NextResponse.json(
      { error: 'name, class_id, number are required' },
      { status: 400 }
    );
  }

  const { data: classRow, error: classLookupError } = await supabaseClient
    .from('book_report_classes')
    .select('id')
    .eq('id', class_id)
    .maybeSingle();

  if (classLookupError) {
    console.error('Failed to look up class:', classLookupError);
    return NextResponse.json({ error: 'Failed to look up class' }, { status: 500 });
  }
  if (!classRow) {
    return NextResponse.json({ error: '존재하지 않는 학급입니다.' }, { status: 400 });
  }

  // A number identifies exactly one student within a class (enforced by a
  // unique(class_id, number) constraint), so look up by number alone and
  // treat a name mismatch as "wrong number", not "new student".
  let { data: studentRow } = await supabaseClient
    .from('book_report_students')
    .select('id, name, class_id, number')
    .eq('class_id', class_id)
    .eq('number', number)
    .maybeSingle();

  if (studentRow && studentRow.name !== name) {
    return NextResponse.json(
      { error: '이 번호는 이미 다른 이름으로 등록되어 있어요. 번호를 다시 확인해주세요.' },
      { status: 409 }
    );
  }

  if (!studentRow) {
    const { data: newStudent, error: studentError } = await supabaseClient
      .from('book_report_students')
      .insert({ name, class_id, number })
      .select()
      .single();

    if (studentError && studentError.code === UNIQUE_VIOLATION) {
      // Lost the race to create this student — re-select the row the winner inserted.
      const { data: existingStudent, error: reselectError } = await supabaseClient
        .from('book_report_students')
        .select('id, name, class_id, number')
        .eq('class_id', class_id)
        .eq('number', number)
        .maybeSingle();
      if (reselectError || !existingStudent) {
        console.error('Failed to re-select student after unique violation:', reselectError);
        return NextResponse.json({ error: 'Failed to get or create student' }, { status: 500 });
      }
      if (existingStudent.name !== name) {
        return NextResponse.json(
          { error: '이 번호는 이미 다른 이름으로 등록되어 있어요. 번호를 다시 확인해주세요.' },
          { status: 409 }
        );
      }
      studentRow = existingStudent;
    } else if (studentError) {
      console.error('Failed to create student:', studentError);
      return NextResponse.json({ error: 'Failed to get or create student' }, { status: 500 });
    } else {
      studentRow = newStudent;
    }
  }

  if (!studentRow) {
    return NextResponse.json({ error: 'Failed to get or create student' }, { status: 500 });
  }

  return NextResponse.json({ student: studentRow });
}
