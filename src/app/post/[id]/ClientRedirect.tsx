"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClientRedirect({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/?post=${encodeURIComponent(id)}`);
  }, [id, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <p className="text-muted-foreground animate-pulse">Redirecting to article...</p>
    </div>
  );
}
