import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import MobileGateScanner from '@/components/MobileGateScanner';

export default async function GateScanPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect('/auth/login');
  }

  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: {
      invitations: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Security check: Only the authenticated event owner can access the scanner
  if (event.userId !== session.id) {
    redirect('/dashboard');
  }

  const totalGuests = event.invitations.length;
  const initialCheckedIn = event.invitations.filter((i) => i.status === 'checked_in').length;

  return (
    <MobileGateScanner
      event={{
        id: event.id,
        title: event.title,
        totalGuests,
        initialCheckedIn,
      }}
    />
  );
}
