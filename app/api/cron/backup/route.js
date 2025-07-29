// frontend/app/api/cron/backup/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  if (request.method !== 'POST') {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  }

  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/backup/create`,
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.BACKEND_API_TOKEN}`,
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: `Backup created: ${response.data.filename}`,
        url: response.data.url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cron backup error:', error.message);
    return NextResponse.json(
      { success: false, message: error.response?.data?.message || 'Failed to create backup' },
      { status: 500 }
    );
  }
}