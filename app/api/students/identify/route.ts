import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json();
  const { name, className, number } = body;

  const numberMissing =
    number === undefined || number === null || Number.isNaN(number);

  if (!name || !className || numberMissing) {
    return NextResponse.json(
      { error: 'name, className, number are required' },
      { status: 400 }
    );
  }

  const UNIQUE_VIOLATION = '23505';

  let { data: classRow } = await supabaseClient
    .from('book_report_classes')
    .select('id, name')
    .eq('name', className)
    .maybeSingle();

  if (!classRow) {
    const { data: newClass, error: classError } = await supabaseClient
      .from('book_report_classes')
      .insert({ name: className })
      .select()
      .single();

    if (classError && classError.code === UNIQUE_VIOLATION) {
      // Lost the race to create this class — re-select the row the winner inserted.
      const { data: existingClass, error: reselectError } = await supabaseClient
        .from('book_report_classes')
        .select('id, name')
        .eq('name', className)
        .maybeSingle();
      if (reselectError || !existingClass) {
        console.error('Failed to re-select class after unique violation:', reselectError);
        return NextResponse.json({ error: 'Failed to get or create class' }, { status: 500 });
      }
      classRow = existingClass;
    } else if (classError) {
      console.error('Failed to create class:', classError);
      return NextResponse.json({ error: 'Failed to get or create class' }, { status: 500 });
    } else {
      classRow = newClass;
    }
  }

  if (!classRow) {
    return NextResponse.json({ error: 'Failed to get or create class' }, { status: 500 });
  }

  let { data: studentRow } = await supabaseClient
    .from('book_report_students')
    .select('id, name, class_id, number')
    .eq('class_id', classRow.id)
    .eq('name', name)
    .eq('number', number)
    .maybeSingle();

  if (!studentRow) {
    const { data: newStudent, error: studentError } = await supabaseClient
      .from('book_report_students')
      .insert({ name, class_id: classRow.id, number })
      .select()
      .single();

    if (studentError && studentError.code === UNIQUE_VIOLATION) {
      // Lost the race to create this student — re-select the row the winner inserted.
      const { data: existingStudent, error: reselectError } = await supabaseClient
        .from('book_report_students')
        .select('id, name, class_id, number')
        .eq('class_id', classRow.id)
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
