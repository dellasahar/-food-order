import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200, message = 'Success') {
  return NextResponse.json({ success: true, message, data }, { status })
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message, data: null }, { status })
}

export async function readJson<T>(request: Request) {
  try {
    return { value: (await request.json()) as T }
  } catch {
    return { error: fail('Invalid JSON body.', 400) }
  }
}

export function parseId(value: string) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}
