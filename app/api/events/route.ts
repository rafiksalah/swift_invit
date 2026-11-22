import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email';
import { randomUUID } from 'crypto';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseAndDeduplicateEmails(raw: string): string[] {
  if (!raw || typeof raw !== 'string') return [];
  const tokens = raw.split(/[\r\n,; \t]+/);
  const validSet = new Set<string>();

  for (const token of tokens) {
    const cleaned = token.trim().toLowerCase();
    if (cleaned && EMAIL_REGEX.test(cleaned)) {
      validSet.add(cleaned);
    }
  }

  return Array.from(validSet);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, location, dateTime, guestEmailsRaw } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Event title is required.' }, { status: 400 });
    }

    if (!location || typeof location !== 'string' || location.trim().length === 0) {
      return NextResponse.json({ error: 'Event location is required.' }, { status: 400 });
    }

    if (!dateTime) {
      return NextResponse.json({ error: 'Date and time are required.' }, { status: 400 });
    }

    const eventDate = new Date(dateTime);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json({ error: 'Invalid event date and time.' }, { status: 400 });
    }

    const emails = parseAndDeduplicateEmails(guestEmailsRaw || '');
    if (emails.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one valid guest email address.' },
        { status: 400 }
      );
    }

    // Prepare invitations with explicit UUIDs so we have the IDs for email sending
    const invitationsToCreate = emails.map((email) => ({
      id: randomUUID(),
      guestEmail: email,
      status: 'pending',
    }));

    // Create Event and its Invitations in a single transaction
    const newEvent = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        location: location.trim(),
        dateTime: eventDate,
        userId: session.id,
        invitations: {
          create: invitationsToCreate.map((inv) => ({
            id: inv.id,
            guestEmail: inv.guestEmail,
            status: inv.status,
          })),
        },
      },
      include: {
        invitations: true,
      },
    });

    // Trigger asynchronous email dispatch (don't block the HTTP response if slow)
    // Run asynchronously in the background
    (async () => {
      for (const inv of newEvent.invitations) {
        try {
          await sendInvitationEmail({
            guestEmail: inv.guestEmail,
            eventTitle: newEvent.title,
            eventDescription: newEvent.description,
            eventLocation: newEvent.location,
            eventDateTime: newEvent.dateTime,
            invitationId: inv.id,
          });
        } catch (err) {
          console.error(`Failed to send invite email to ${inv.guestEmail}:`, err);
        }
      }
    })();

    return NextResponse.json({
      success: true,
      eventId: newEvent.id,
      totalGuests: newEvent.invitations.length,
      message: `Event created successfully! ${newEvent.invitations.length} invitations dispatched.`,
    });
  } catch (error: unknown) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event. Please verify your inputs and try again.' },
      { status: 500 }
    );
  }
}
