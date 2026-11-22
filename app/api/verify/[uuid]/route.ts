import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

interface VerificationResult {
  valid: boolean;
  status: 'invalid' | 'duplicate' | 'success';
  message: string;
  guestEmail?: string;
  scannedAt?: string | null;
  eventTitle?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { uuid: string } }
) {
  return handleVerification(req, params.uuid);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { uuid: string } }
) {
  return handleVerification(req, params.uuid);
}

async function handleVerification(req: NextRequest, rawUuid: string): Promise<NextResponse> {
  try {
    // 1. Authenticate Organizer Session
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        {
          valid: false,
          status: 'invalid',
          message: 'UNAUTHORIZED - Please log in to validate tickets.',
        },
        { status: 401 }
      );
    }

    // Clean UUID
    const uuid = rawUuid.trim();
    if (!uuid) {
      return NextResponse.json(
        {
          valid: false,
          status: 'invalid',
          message: 'INVALID TICKET - Not on guest list.',
        },
        { status: 404 }
      );
    }

    // 2. Transaction with Row-Level Locking (InnoDB FOR UPDATE)
    // Prevents race conditions when scanning the same ticket concurrently on two devices
    const result = await prisma.$transaction(
      async (tx) => {
        let invitation: {
          id: string;
          eventId: string;
          guestEmail: string;
          status: string;
          scannedAt: Date | null;
        } | null = null;

        try {
          // Attempt exclusive row lock for MySQL
          const lockedRows = await tx.$queryRaw<
            Array<{
              id: string;
              eventId: string;
              guestEmail: string;
              status: string;
              scannedAt: Date | null;
            }>
          >`SELECT id, eventId, guestEmail, status, scannedAt FROM \`Invitation\` WHERE id = ${uuid} FOR UPDATE`;

          if (lockedRows && lockedRows.length > 0) {
            invitation = lockedRows[0];
          }
        } catch (rawError) {
          // Fallback to standard transactional findUnique if raw query fails (e.g. non-MySQL dev mock)
          console.warn('Raw lock query fallback, using standard tx query:', rawError);
          invitation = await tx.invitation.findUnique({
            where: { id: uuid },
          });
        }

        // Scenario 1: UUID not found in database
        if (!invitation) {
          return {
            valid: false,
            status: 'invalid' as const,
            message: 'INVALID TICKET - Not on guest list.',
          };
        }

        // Verify that the event belongs to this organizer
        const event = await tx.event.findUnique({
          where: { id: invitation.eventId },
          select: { id: true, title: true, userId: true },
        });

        if (!event || event.userId !== session.id) {
          return {
            valid: false,
            status: 'invalid' as const,
            message: 'INVALID TICKET - Not on guest list.',
          };
        }

        // Scenario 2: Status is already "checked_in"
        if (invitation.status === 'checked_in') {
          const scannedAtFormatted = invitation.scannedAt
            ? new Date(invitation.scannedAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })
            : 'earlier';

          return {
            valid: false,
            status: 'duplicate' as const,
            message: `DUPLICATE TICKET - Already scanned at ${scannedAtFormatted}!`,
            guestEmail: invitation.guestEmail,
            scannedAt: invitation.scannedAt ? invitation.scannedAt.toISOString() : null,
            eventTitle: event.title,
          };
        }

        // Scenario 3: Status is "pending" -> Check-in guest
        const now = new Date();
        await tx.invitation.update({
          where: { id: uuid },
          data: {
            status: 'checked_in',
            scannedAt: now,
          },
        });

        return {
          valid: true,
          status: 'success' as const,
          message: `WELCOME! - ${invitation.guestEmail} checked in successfully.`,
          guestEmail: invitation.guestEmail,
          scannedAt: now.toISOString(),
          eventTitle: event.title,
        };
      },
      {
        timeout: 10000,
      }
    );

    const httpStatus = result.status === 'invalid' ? 404 : 200;
    return NextResponse.json(result, { status: httpStatus });
  } catch (error) {
    console.error('Ticket verification error:', error);
    return NextResponse.json(
      {
        valid: false,
        status: 'invalid',
        message: 'INVALID TICKET - Verification server error.',
      },
      { status: 500 }
    );
  }
}
