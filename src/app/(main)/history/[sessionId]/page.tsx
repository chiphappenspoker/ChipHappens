import { SessionDetailContent } from './SessionDetailContent';

/** Required for static export: one placeholder path; session is resolved client-side. */
export function generateStaticParams() {
  return [{ sessionId: 'session' }];
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <SessionDetailContent sessionId={sessionId} />;
}
