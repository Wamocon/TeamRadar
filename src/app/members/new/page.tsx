'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewMemberPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/members?action=invite');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-sm text-gray-500">Redirecting to modal...</div>
    </div>
  );
}
