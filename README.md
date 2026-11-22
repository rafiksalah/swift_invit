# SwiftInvite 🎟️

> Lightweight, frictionless web-based event invitation and gate check-in system packaged for zero-configuration Docker deployment.

---

## ⚡ Features

- **Single-Page Event Creation:** Enter title, location, date/time, and paste your guest list (separated by commas or newlines). No multi-step wizards.
- **Automated QR Pass Dispatch:** Generates unique validation UUID tokens for each guest and sends mobile-friendly, high-contrast HTML invitations via Resend with embedded QR codes.
- **Mobile Gate Validator (`html5-qrcode`):** Turn your phone camera into a high-speed bouncer scanner with instant color-coded visual feedback:
  - 🟢 **Solid Green:** `"WELCOME! - [guestEmail] checked in successfully."`
  - 🟡 **Solid Yellow:** `⚠️ "DUPLICATE TICKET - Already scanned at [scannedAt]!"`
  - 🔴 **Solid Red:** `❌ "INVALID TICKET - Not on guest list."`
  - ⏱️ **2.5-Second Cooldown:** Auto-resets back to scanning mode with an animated countdown.
  - 🔊 **Audio & Haptic Feedback:** Web Audio chimes and vibration cues for noisy environments.
  - ⌨️ **Manual UUID Fallback:** Input field to type or paste ticket tokens if camera is unavailable.
- **Strict Concurrency Safety:** Transactional row-level locking (`SELECT ... FOR UPDATE` in MySQL InnoDB) prevents race conditions even if a single pass is scanned simultaneously on two devices.
- **Zero-Config Docker Deployment:** Orchestrated multi-container setup (Next.js Standalone + MySQL 8.0) with automated schema push on startup.

---

## 🏗️ Tech Stack

- **Framework:** [Next.js 14 (App Router)](https://nextjs.org/) + TypeScript + Tailwind CSS
- **Database:** MySQL 8.0 / MariaDB
- **ORM:** [Prisma ORM](https://www.prisma.io/)
- **Email Engine:** [Resend](https://resend.com/) + `@react-email/components`
- **QR Scanner:** [`html5-qrcode`](https://github.com/mebjas/html5-qrcode)
- **Containerization:** Docker & Docker Compose

---

## 🚀 Quick Start (Docker Compose)

The entire application and database can be spun up with one command:

```bash
docker compose up --build
```

1. **MySQL Container (`swiftinvite_mysql`):** Automatically initializes the database and performs healthchecks on port `3306`.
2. **Web Container (`swiftinvite_web`):** Waits for MySQL healthcheck, runs `prisma db push`, and launches the Next.js standalone server on port `3000`.
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Local Development (Without Docker)

### Prerequisites

- Node.js 18+ (tested on Node 18, 20, 22)
- Running MySQL instance (or local connection string)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` based on `.env.example`:\n
```env
DATABASE_URL="mysql://swift_dev_user:swift_dev_password@localhost:3306/swiftinvite_dev"
NEXTAUTH_SECRET="local_nextauth_secret_key_123"
RESEND_API_KEY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Note:** If `RESEND_API_KEY` is omitted, emails are simulated and logged to the server console with ticket links.

### 3. Generate Prisma Client & Push Schema

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

---

## 📱 User Flows & Routes

| Route | Description |
| --- | --- |
| `/` | Landing page showcasing SwiftInvite features |
| `/auth/register` | Organizer account registration |
| `/auth/login` | Organizer sign in |
| `/dashboard` | Organizer dashboard with event list, check-in ratios, and quick links |
| `/events/new` | Frictionless event creation & batch email invitation dispatch |
| `/events/[id]` | Event overview, check-in progress, guest roster, and pass links |
| `/events/[id]/scan` | Mobile camera gate validator (requires organizer session) |
| `/api/verify/[uuid]` | Transactional ticket validation API with concurrency lock |
| `/verify/[uuid]` | Public digital ticket pass for guests with dynamic QR code |

---

## 🔒 Security & Verification Details

1. **Organizer Authorization:** Only the event creator can access `/events/[eventId]/scan` and execute validations via `/api/verify/[uuid]`.
2. **Simultaneous Scan Protection:** The validation route utilizes a transactional exclusive row-lock (`SELECT ... FOR UPDATE` inside `prisma.$transaction`), guaranteeing that simultaneous scans at the exact same millisecond will not result in multiple check-ins.
3. **Camera Context:** Camera access via `html5-qrcode` functions securely over `localhost` or `127.0.0.1` for local development, and HTTPS in production.
