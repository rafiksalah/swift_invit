import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { parseAndDeduplicateEmails } from '@/app/api/events/route';
import { sendInvitationEmail } from '@/lib/email';
import { randomUUID } from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { eventId } = params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { invitations: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    if (event.userId !== session.id) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this event.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const emails = parseAndDeduplicateEmails(body.guestEmailsRaw || '');

    if (emails.length === 0) {
      return NextResponse.json(
        { error: 'Please enter at least one valid email.' },
        { status: 400 }
      );
    }

    const existingEmails = new Set(event.invitations.map((i) => i.guestEmail.toLowerCase()));
    const newEmails = emails.filter((email) => !existingEmails.has(email));

    if (newEmails.length === 0) {
      return NextResponse.json(
        { message: 'All entered guests are already on the invitation list.' },
        { status: 200 }
      );
    }

    const newInvitations = newEmails.map((email) => ({
      id: randomUUID(),
      eventId: event.id,
      guestEmail: email,
      status: 'pending',
    }));

    await prisma.invitation.createMany({
      data: newInvitations,
    });

    // Send emails in background
    (async () => {
      for (const inv of newInvitations) {
        try {
          await sendInvitationEmail({
            guestEmail: inv.guestEmail,
            eventTitle: event.title,
            eventDescription: event.description,
            eventLocation: event.location,
            eventDateTime: event.dateTime,
            invitationId: inv.id,
          });
        } catch (err) {
          console.error(`Failed to send invite email to ${inv.guestEmail}:`, err);
        }
      }
    })();

    return NextResponse.json({
      success: true,
      addedCount: newInvitations.length,
      message: `Added ${newInvitations.length} new guests and dispatched invitations!`,
    });
  } catch (err) {
    console.error('Error adding guests:', err);
    return NextResponse.json({ error: 'Failed to add guests.' }, { status: 500 });
  }
}
