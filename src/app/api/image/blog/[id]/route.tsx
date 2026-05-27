import { ImageResponse } from 'next/og';
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

    if (!dataUri || !dataUri.startsWith('data:image/')) {
      const defaultUrl = new URL('/fbpage.png', req.url);
      return NextResponse.redirect(defaultUrl);
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: '#f7f6f2',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={dataUri}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error serving image:', error);
    const defaultUrl = new URL('/fbpage.png', req.url);
    return NextResponse.redirect(defaultUrl);
  }
}
