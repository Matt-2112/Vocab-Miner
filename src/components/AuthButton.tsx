"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />;
  }

  if (session) {
    return (
      <div className="flex items-center gap-3">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "avatar"}
            width={28}
            height={28}
            className="rounded-full"
          />
        )}
        <span className="hidden sm:block text-sm text-white/60">
          {session.user.name}
        </span>
        {session.user.tier === "premium" && (
          <span className="text-[10px] font-semibold tracking-widest uppercase text-[#4ade80] bg-[#4ade80]/10 px-2 py-0.5 rounded-full">
            Pro
          </span>
        )}
        <button
          onClick={() => signOut()}
          className="text-sm text-white/40 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="bg-[#4ade80] text-[#0d0d0d] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#22c55e] transition-colors"
    >
      Sign in
    </button>
  );
}
