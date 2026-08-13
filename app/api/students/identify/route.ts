import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

const UNIQUE_VIOLATION = '23505';

export async function POST(req: Request) {
  const body = await req.json();
  const { name, class_id, number } = body;

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

  let { data: studentRow } = await supabaseClient
    .from('book_report_students')
    .select('id, name, class_id, number')
    .eq('class_id', class_id)
    .eq('name', name)
    .eq('number', number)
    .maybeSingle();

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
        .eq('name', name)
        .eq('number', number)
        .maybeSingle();
      if (reselectError || !existingStudent) {
        console.error('Failed to re-select student after unique violation:', reselectError);
        return NextResponse.json({ error: 'Failed to get or create student' }, { status: 500 });
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
