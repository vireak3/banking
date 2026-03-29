"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Loader } from "@/components/Loader";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isReady, pathname, router]);

  if (!isReady || !isAuthenticated) {
    return <Loader label="Verifying your secure session..." />;
  }

  return <>{children}</>;
}