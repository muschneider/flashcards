import { NextRequest } from 'next/server';

// Server-side text-to-speech proxy.
//
// The browser's built-in Web Speech API depends on TTS voices installed on the
// operating system, which are often missing (e.g. Linux without speech-dispatcher).
// This route proxies Google Translate's TTS endpoint so audio works on any device
// with speakers, for arbitrary short text such as example sentences.

const MAX_LEN = 200; // Google Translate TTS accepts ~200 chars per request.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const lang = (searchParams.get('lang') || 'en').slice(0, 5);

  if (!q) {
    return new Response('Missing "q" query parameter', { status: 400 });
  }

  const text = q.slice(0, MAX_LEN);
  const upstream = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
    lang,
  )}&q=${encodeURIComponent(text)}`;

  try {
    const res = await fetch(upstream, {
      headers: {
        // A browser-like User-Agent is required or the endpoint returns 404.
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
      // Cache upstream responses at the edge/CDN where possible.
      cache: 'force-cache',
    });

    if (!res.ok || !res.body) {
      console.error('TTS upstream error:', res.status);
      return new Response('TTS upstream error', { status: 502 });
    }

    return new Response(res.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        // Pronunciations never change — cache aggressively in the browser.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('TTS route error:', error);
    return new Response('Failed to fetch audio', { status: 500 });
  }
}
