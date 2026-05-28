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
      const defaultUrl = new URL('/fbpage.png', req.url);
      return NextResponse.redirect(defaultUrl);
    }

    const match = dataUri.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (match && match.length === 3) {
      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': `image/${mimeType}`,
          'Cache-Control': 'public, max-age=86400, immutable',
        },
      });
    } else if (dataUri.startsWith('http')) {
      return NextResponse.redirect(dataUri);
    }

    const defaultUrl = new URL('/fbpage.png', req.url);
    return NextResponse.redirect(defaultUrl);
  } catch (error) {
    console.error('Error serving image:', error);
    const defaultUrl = new URL('/fbpage.png', req.url);
    return NextResponse.redirect(defaultUrl);
  }
}
