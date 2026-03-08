import { JoinByCodeContent } from './JoinByCodeContent';

/** Required for static export: one placeholder path; all codes are resolved client-side. */
export function generateStaticParams() {
  return [{ code: 'invite' }];
}

export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <JoinByCodeContent code={code} />;
}
