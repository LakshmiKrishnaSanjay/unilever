import { redirect } from 'next/navigation';

export default function PTWDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Immediately redirect to the canonical permits page
  redirect(`/permits/${params.id}`);
}
