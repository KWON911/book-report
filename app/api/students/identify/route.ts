import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json();
  const { name, className, number } = body;

  if (!name || !className || !number) {
    return NextResponse.json(
      { error: 'name, className, number are required' },
      { status: 400 }
    );
  }

  let { data: classRow } = await supabaseClient
    .from('classes')
    .select('id, name')
    .eq('name', className)
    .maybeSingle();

  if (!classRow) {
    const { data: newClass, error: classError } = await supabaseClient
      .from('classes')
      .insert({ name: className })
      .select()
      .single();
    if (classError) {
      return NextResponse.json({ error: classError.message }, { status: 500 });
    }
    classRow = newClass;
  }

  if (!classRow) {
    return NextResponse.json({ error: 'Failed to get or create class' }, { status: 500 });
  }

  let { data: studentRow } = await supabaseClient
    .from('students')
    .select('id, name, class_id, number')
    .eq('class_id', classRow.id)
    .eq('name', name)
    .eq('number', number)
    .maybeSingle();

  if (!studentRow) {
    const { data: newStudent, error: studentError } = await supabaseClient
      .from('students')
      .insert({ name, class_id: classRow.id, number })
      .select()
      .single();
    if (studentError) {
      return NextResponse.json({ error: studentError.message }, { status: 500 });
    }
    studentRow = newStudent;
  }

  if (!studentRow) {
    return NextResponse.json({ error: 'Failed to get or create student' }, { status: 500 });
  }

  return NextResponse.json({ student: studentRow });
}
