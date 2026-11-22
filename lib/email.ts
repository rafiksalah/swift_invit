import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendInvitationParams {
  guestEmail: string;
  eventTitle: string;
  eventDescription?: string | null;
  eventLocation: string;
  eventDateTime: Date | string;
  invitationId: string;
}

export function generateInvitationEmailHtml(params: {
  eventTitle: string;
  eventDescription?: string | null;
  eventLocation: string;
  formattedDate: string;
  ticketUrl: string;
  qrCodeUrl: string;
}): string {
  const { eventTitle, eventDescription, eventLocation, formattedDate, ticketUrl, qrCodeUrl } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to ${escapeHtml(eventTitle)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);">
          <!-- Header (Deep Navy) -->
          <tr>
            <td style="padding: 36px 28px 24px; text-align: center; background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%);">
              <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #F97316;">Official Digital Pass</span>
              <h1 style="margin: 12px 0 0; font-size: 26px; font-weight: 800; color: #FFFFFF; line-height: 1.25;">
                You're invited to ${escapeHtml(eventTitle)}!
              </h1>
            </td>
          </tr>

          <!-- Event Details -->
          <tr>
            <td style="padding: 32px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #64748B; font-weight: 500;">
                      📅 <strong style="color: #0F172A; margin-left: 6px;">When:</strong> ${escapeHtml(formattedDate)}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #64748B; font-weight: 500;">
                      📍 <strong style="color: #0F172A; margin-left: 6px;">Where:</strong> ${escapeHtml(eventLocation)}
                    </p>
                  </td>
                </tr>
              </table>

              ${
                eventDescription
                  ? `<div style="margin-bottom: 24px; padding: 0 4px;">
                      <p style="margin: 0; font-size: 15px; color: #334155; line-height: 1.6;">
                        ${escapeHtml(eventDescription)}
                      </p>
                    </div>`
                  : ''
              }

              <!-- QR Code Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="text-align: center; background-color: #FFFFFF; border-radius: 16px; border: 2px solid #E2E8F0; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 14px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0F172A;">
                      Scan At Gate Entrance
                    </p>
                    <img src="${qrCodeUrl}" alt="Check-in QR Code" width="220" height="220" style="display: block; margin: 0 auto; border: 1px solid #CBD5E1; border-radius: 10px;" />
                    <p style="margin: 12px 0 0; font-size: 11px; color: #64748B; font-family: monospace;">
                      Present this QR code to the door attendant
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Primary CTA Button (Warm Vibrant Orange) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="text-align: center; margin-bottom: 16px;">
                <tr>
                  <td align="center">
                    <a href="${ticketUrl}" style="display: inline-block; background-color: #EA580C; color: #FFFFFF; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);">
                      View Digital Ticket
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; text-align: center; font-size: 13px; color: #64748B; line-height: 1.5;">
                Can't see the QR code? <a href="${ticketUrl}" style="color: #2563EB; font-weight: 600; text-decoration: underline;">Click here to view your ticket.</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 28px; text-align: center; border-top: 1px solid #E2E8F0; background-color: #F8FAFC;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                Sent via <strong style="color: #0F172A;">SwiftInvite</strong> &bull; Zero-friction event passes
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendInvitationEmail(params: SendInvitationParams): Promise<{
  success: boolean;
  simulated?: boolean;
  error?: string;
}> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const ticketUrl = `${appUrl}/verify/${params.invitationId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(ticketUrl)}`;

  const eventDate =
    typeof params.eventDateTime === 'string'
      ? new Date(params.eventDateTime)
      : params.eventDateTime;
  
  const formattedDate = eventDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const html = generateInvitationEmailHtml({
    eventTitle: params.eventTitle,
    eventDescription: params.eventDescription,
    eventLocation: params.eventLocation,
    formattedDate,
    ticketUrl,
    qrCodeUrl,
  });

  if (!resend || !resendApiKey || resendApiKey.trim() === '' || resendApiKey === 'your_resend_api_key') {
    console.log(`[SIMULATED EMAIL] To: ${params.guestEmail} | Event: "${params.eventTitle}" | Ticket: ${ticketUrl}`);
    return { success: true, simulated: true };
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || 'SwiftInvite <onboarding@resend.dev>';
    const response = await resend.emails.send({
      from: fromAddress,
      to: params.guestEmail,
      subject: `You're invited to ${params.eventTitle}!`,
      html,
    });

    if (response.error) {
      console.error(`[RESEND ERROR] Failed to send email to ${params.guestEmail}:`, response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[RESEND EXCEPTION] To ${params.guestEmail}:`, errMsg);
    return { success: false, error: errMsg };
  }
}
