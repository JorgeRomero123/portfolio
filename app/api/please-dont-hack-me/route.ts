import { NextResponse } from 'next/server';

export async function GET() {
  // Create a simple response
  const response = NextResponse.json({
    message: "Nothing to see here... move along!",
    status: "secure",
    timestamp: new Date().toISOString()
  });

  // Add the secret header with a base64-encoded image URL
  // This will be the first clue - users need to inspect network headers
  const secretClue = "https://play-lh.googleusercontent.com/IdbW0FQfRtGD_XSGG-lpbS5gi-S-GCqVuNkbj8X3lG3FEDdBYCEZMM9gOzhigTAqoWM";
  response.headers.set('X-Secret-Image', Buffer.from(secretClue).toString('base64'));

  // Add some red herring headers to make it more fun
  response.headers.set('X-Security-Level', '9000');
  response.headers.set('X-Totally-Not-Suspicious', 'definitely-not-hiding-anything');

  return response;
}
