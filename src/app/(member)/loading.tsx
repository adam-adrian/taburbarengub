import { PageSkeleton } from '@/components/ui/page-skeleton'

// Nutup /tiket-saya <-> /tiket-saya/[id]; layout ter-dalam yang di-share
// keduanya adalah (member)/layout.tsx.
export default function Loading() {
  return <PageSkeleton />
}
