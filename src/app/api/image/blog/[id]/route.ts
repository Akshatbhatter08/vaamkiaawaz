import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { postImage: true, content: true },
    });

    let dataUri = post?.postImage;

    if (!dataUri && post?.content) {
      const match = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      dataUri = match ? match[1] : null;
    }

    if (!dataUri) {
      const defaultUrl = new URL('/vaamki-logo-sm.png', req.url);
      return NextResponse.redirect(defaultUrl);
    }

    if (!dataUri.startsWith('data:image/')) {
      if (dataUri.startsWith('http')) {
        return NextResponse.redirect(dataUri);
      } else {
        const url = new URL(dataUri, req.url);
        return NextResponse.redirect(url);
      }
    }

    const matches = dataUri.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      const defaultUrl = new URL('/vaamki-logo-sm.png', req.url);
      return NextResponse.redirect(defaultUrl);
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    return new Response(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    const defaultUrl = new URL('/vaamki-logo-sm.png', req.url);
    return NextResponse.redirect(defaultUrl);
  }
}
