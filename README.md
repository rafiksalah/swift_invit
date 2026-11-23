# SwiftInvite 🎟️

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
[![Live Client Preview](https://img.shields.io/badge/Live%20Client%20Preview-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://rafiksalah.github.io/swift_invit/)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy%20with-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/rafiksalah/swift_invit)

<p align="center">
  <strong>Lightweight, frictionless web-based event invitation and gate check-in system packaged for zero-configuration Docker deployment.</strong>
</p>

<p align="center">
  <a href="https://rafiksalah.github.io/swift_invit/"><strong>🚀 Live Client Preview</strong></a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-architecture--flow">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-quick-start-docker-compose">Quick Start</a> •
  <a href="#-manual-local-setup">Local Setup</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-security--concurrency-guarantees">Security</a>
</p>

</div>

---

## 📖 Overview

Most event ticketing solutions (Eventbrite, Luma, Ticketmaster) are bloated, complex, and require multi-step account creations, ticketing tiers, payment setups, and app downloads.

**SwiftInvite** was engineered for casual event organizers, meetup hosts, and private party coordinators who value raw simplicity and speed:
1. **Single-screen setup:** Paste your guest emails in one textarea.
2. **Instant digital pass dispatch:** Clean HTML invitation emails delivered with embedded dynamic QR codes.
3. **Turn any phone into a bouncer gate scanner:** High-speed client-side camera scanning with full-screen tri-color feedback (Green / Yellow / Red), Web Audio sound cues, haptic vibrations, and automatic 2.5-second reset.
4. **Strict concurrency protection:** Transactional row-level locking (`SELECT ... FOR UPDATE` in MySQL InnoDB) completely eliminates race conditions when multiple door attendants scan passes simultaneously.

---

## ⚡ Key Features

### 🎪 For Event Organizers
- **Zero-Friction Event Creation:** Single-page form to specify title, location, date/time, and paste your attendee list. No wizards or multi-page forms.
- **Smart Recipient Parser:** Automatically extracts, sanitizes, and deduplicates guest emails separated by line breaks, commas, semicolons, or spaces.
- **Dynamic Guest Roster Management:** Search attendees in real-time by email, filter by check-in status (`All`, `Checked In`, `Pending`), and append more guests anytime.
- **Live Attendance Dashboard:** Real-time check-in ratios (e.g. `24/50 Checked In (48%)`) with animated admission progress bars.

### 📱 For Guests
- **High-Contrast Digital Passes:** Mobile-optimized, accessible email invitations rendered with `@react-email/components`.
- **Dynamic QR Ticket View (`/verify/[uuid]`):** A dedicated, responsive public web pass showing event coordinates, time, and live check-in status.
- **No App Installation:** Works in standard mobile browsers (Safari, Chrome, Firefox) and Outlook/Gmail native apps.

### 🛡️ For Gate Bouncers & Door Staff
- **Browser-Native Camera Scanner (`/events/[id]/scan`):** Powered by `html5-qrcode` accessing back/environment smartphone cameras with zero native apps.
- **Tri-Color Instant State Machine:**
  | State | Screen Feedback | Meaning & Response |
  | :--- | :--- | :--- |
  | 🟢 **WELCOME** | **Solid Green Screen** | Ticket valid! Guest checked in, logged with timestamp, two-tone chime & double vibration. |
  | 🟡 **DUPLICATE** | **Solid Yellow Screen** | ⚠️ Ticket already scanned! Displays previous scan timestamp and warning buzzer. |
  | 🔴 **INVALID** | **Solid Red Screen** | ❌ Token does not exist on guest list or invalid UUID. Low discordant buzz alert. |
- **2.5s Auto-Cooldown Loop:** Visual animated progress bar resets the camera scanner back to active mode automatically without pressing buttons.
- **Audio & Haptic Feedback:** Web Audio API sound synthesis (sine/triangle waves) and `navigator.vibrate` patterns ensure bouncers get clear signals even in loud party environments.
- **Manual Token Fallback:** Built-in drawer to type or paste ticket tokens if a guest's screen is cracked or camera is unavailable.

---

## 🏗️ Architecture & Flow

```mermaid
sequenceDiagram
    autonumber
    actor Organizer
    participant Web as Next.js Web App
    participant DB as MySQL (InnoDB)
    participant Resend as Resend Email API
    actor Guest
    actor Bouncer as Gate Attendant

    Organizer->>Web: Create Event & Paste Emails
    Web->>DB: Transaction: Create Event + Invitations (UUIDs)
    Web->>Resend: Batch dispatch invitation emails
    Resend-->>Guest: Deliver email with embedded QR code
    Guest->>Bouncer: Presents QR Code on mobile device
    Bouncer->>Web: Camera scans QR (/events/[id]/scan)
    Web->>DB: BEGIN TX -> SELECT ... FOR UPDATE (Row Lock)
    alt Status == pending
        DB->>DB: UPDATE status = 'checked_in', scannedAt = NOW()
        DB-->>Web: COMMIT (Valid)
        Web-->>Bouncer: 🟢 Solid Green Screen ("WELCOME!") + Chime
    else Status == checked_in
        DB-->>Web: ROLLBACK (Duplicate)
        Web-->>Bouncer: 🟡 Solid Yellow Screen ("ALREADY SCANNED") + Alert
    else Token not found
        Web-->>Bouncer: 🔴 Solid Red Screen ("INVALID TICKET") + Error
    end
```

---

## 💻 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) | App Router, Server Actions & Standalone Output |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict type definitions across frontend & API |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) | Custom slate/navy design tokens & mobile layouts |
| **Database** | [MySQL 8.0](https://www.mysql.com/) | ACID transactional storage with InnoDB engine |
| **ORM** | [Prisma ORM 5.22](https://www.prisma.io/) | Type-safe schema migrations & transactional queries |
| **Auth** | [Jose](https://github.com/panva/jose) + [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js) | Stateless signed JWT session cookies & salted password hashes |
| **Email Service** | [Resend](https://resend.com/) | Transactional HTML invitations with simulation fallback |
| **QR Scanning** | [html5-qrcode](https://github.com/mebjas/html5-qrcode) | Native HTML5 camera stream with environment lens detection |
| **Containerization** | [Docker Compose](https://docs.docker.com/compose/) | Automated container orchestration with DB healthcheck |

---

## 📁 Project Structure

```
invitationapp/
├── app/                              # Next.js 14 App Router
│   ├── api/                          # REST API route handlers
│   │   ├── auth/                     # login, register, me, logout
│   │   ├── events/                   # event creation & roster management
│   │   │   └── [eventId]/guests/     # batch append new guests
│   │   └── verify/[uuid]/            # transactional ticket validation
│   ├── auth/                         # organizer login & register pages
│   ├── dashboard/                    # organizer events overview
│   ├── events/
│   │   ├── new/                      # single-page event creation
│   │   └── [eventId]/
│   │       ├── page.tsx              # event detail & guest roster
│   │       └── scan/page.tsx         # mobile gate camera scanner
│   ├── verify/[uuid]/                # public digital ticket pass
│   ├── globals.css                   # Tailwind base & root styling
│   ├── layout.tsx                    # root HTML layout
│   └── page.tsx                      # landing hero page
├── components/                       # Client & UI Components
│   ├── GuestListManager.tsx          # interactive roster search & filter
│   ├── MobileGateScanner.tsx         # html5 camera scanner + audio cues
│   └── Navbar.tsx                    # responsive navigation bar
├── lib/                              # Core Utility Modules
│   ├── auth.ts                       # JWT cookie creation, verification & hashing
│   ├── email.ts                      # Resend HTML email generator & queue
│   └── prisma.ts                     # Prisma Client singleton
├── prisma/
│   └── schema.prisma                 # database models & relations
├── public/                           # static assets & robots.txt
├── Dockerfile                        # multi-stage standalone Node.js production image
├── docker-compose.yml                # multi-container orchestration (web + mysql)
├── tailwind.config.ts                # theme colors, fonts, shadow tokens
└── tsconfig.json                     # strict TypeScript compilation settings
```

---

## 🚀 Quick Start (Docker Compose)

The easiest way to run SwiftInvite is with Docker Compose. This starts both the MySQL database and the Next.js server with automated database migration on launch:

```bash
# 1. Clone the repository
git clone https://github.com/rafiksalah/swift_invit.git
cd swift_invit

# 2. Configure environment variables (optional for local dev)
cp .env.example .env

# 3. Spin up application & database containers
docker compose up --build
```

### What happens automatically:
1. `swiftinvite_mysql` container starts and waits for healthy status on port `3306`.
2. `swiftinvite_web` container boots up, executes `npx prisma db push --skip-generate` to create database tables, and starts the standalone Next.js server on port `3000`.
3. Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🛠️ Manual Local Setup (Without Docker)

### Prerequisites
- **Node.js:** `18.17+` or `20.x` / `22.x`
- **Database:** Running MySQL 8.0 server (local or cloud)
- **Package Manager:** `npm` (included with Node.js)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure `.env`
Create a `.env` file in the root directory:
```env
# Database Connection (MySQL)
DATABASE_URL="mysql://swift_dev_user:swift_dev_password@localhost:3306/swiftinvite_dev"

# Session Encryption Secret
NEXTAUTH_SECRET="your_custom_secret_key_change_in_production"

# Resend API Key (Optional: if blank, emails are logged to console)
RESEND_API_KEY=""

# Public Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Generate Prisma Client & Push Schema
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000).

---

## ⚙️ Environment Variables Reference

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `mysql://user:pass@localhost:3306/swiftinvite_dev` | Connection string to MySQL/MariaDB database |
| `NEXTAUTH_SECRET` | **Yes** | `local_nextauth_secret_key_123` | Secret key used to sign and encrypt JWT session cookies |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `http://localhost:3000` | Host URL embedded into digital passes and QR code endpoints |
| `RESEND_API_KEY` | *No* | `re_123456789` | Resend API key for transactional email dispatch. Omit to enable console simulation. |
| `EMAIL_FROM` | *No* | `SwiftInvite <onboarding@resend.dev>` | Verified sender address in Resend |

> 💡 **Development Note:** When `RESEND_API_KEY` is omitted or left empty, emails are simulated safely without crashing. The server logs the recipient and digital pass link directly to the console.

---

## 📡 API Reference

### 🔐 Authentication

#### `POST /api/auth/register`
Create a new organizer account.
- **Request Body:** `{ "email": "organizer@example.com", "password": "securepassword" }`
- **Response:** `201 Created` with signed session cookie.

#### `POST /api/auth/login`
Authenticate existing organizer.
- **Request Body:** `{ "email": "organizer@example.com", "password": "securepassword" }`
- **Response:** `200 OK` with session cookie.

#### `GET /api/auth/me`
Retrieve currently logged-in organizer profile.
- **Response:** `{ "user": { "id": "...", "email": "..." } }`

#### `POST /api/auth/logout`
Clears session cookie.

---

### 🎟️ Events & Guests

#### `POST /api/events`
Create a new event and dispatch batch invitations.
- **Headers:** Session Cookie required
- **Request Body:**
  ```json
  {
    "title": "Startup Demo Night 2026",
    "description": "Pitch competition and networking",
    "location": "Metropolitan Hub, Room 401",
    "dateTime": "2026-12-01T19:00:00.000Z",
    "guestEmailsRaw": "guest1@example.com\nguest2@example.com, guest3@domain.org"
  }
  ```
- **Response:** `200 OK` with `eventId` and `totalGuests`.

#### `POST /api/events/[eventId]/guests`
Append additional guests to an existing event.
- **Request Body:** `{ "guestEmailsRaw": "newguest@example.com" }`
- **Behavior:** Automatically skips emails that are already on the roster.

---

### 🛡️ Ticket Validation

#### `POST /api/verify/[uuid]`
Validates a ticket and performs transactional check-in.
- **Headers:** Organizer Session Cookie required
- **Responses:**
  - **200 OK (First Scan):**
    ```json
    {
      "valid": true,
      "status": "success",
      "message": "WELCOME! - guest@example.com checked in successfully.",
      "guestEmail": "guest@example.com",
      "scannedAt": "2026-11-23T10:15:30.000Z"
    }
    ```
  - **200 OK (Duplicate Scan):**
    ```json
    {
      "valid": false,
      "status": "duplicate",
      "message": "DUPLICATE TICKET - Already scanned at 10:15:30 AM!",
      "guestEmail": "guest@example.com",
      "scannedAt": "2026-11-23T10:15:30.000Z"
    }
    ```
  - **404 Not Found (Invalid Pass):**
    ```json
    {
      "valid": false,
      "status": "invalid",
      "message": "INVALID TICKET - Not on guest list."
    }
    ```

---

## 🔒 Security & Concurrency Guarantees

1. **Row-Level Locking Against Concurrency Exploits:**
   In bustling events, malicious attendees or accidental simultaneous scans across two gates could cause double check-ins. SwiftInvite executes validations within an isolated `prisma.$transaction` using MySQL InnoDB's exclusive row lock:
   ```sql
   SELECT id, eventId, guestEmail, status, scannedAt 
   FROM `Invitation` 
   WHERE id = ? FOR UPDATE;
   ```
   Any concurrent scan is forced to wait until the first transaction commits, guaranteeing that status transitions from `pending` to `checked_in` atomically.

2. **Organizer Authorization Check:**
   Only the organizer who created the event is authorized to access `/events/[id]/scan` or trigger validations via `/api/verify/[uuid]`. Unauthorized attendees attempting to call validation endpoints receive `401 Unauthorized` or `403 Forbidden`.

3. **Camera Context Protection:**
   Modern browsers restrict camera hardware access (`getUserMedia`) to secure contexts (`https://` or `http://localhost`). SwiftInvite works out-of-the-box over `localhost` for local development, and prompts clear diagnostic guidance when deployed behind non-HTTPS domains.

---

## 🗺️ Roadmap

- [x] Frictionless single-page event creation
- [x] Deduplicating bulk email parser
- [x] Automated HTML email passes with embedded QR codes
- [x] Real-time organizer dashboard & search filters
- [x] Client-side mobile camera validator with tri-color state machine
- [x] Web Audio and haptic vibration feedback
- [x] Concurrency-safe transactional row locking (`FOR UPDATE`)
- [x] Multi-container Docker deployment with database healthcheck
- [ ] Export attendee list and scan timestamps to CSV / Excel
- [ ] Offline scanning queue with background sync
- [ ] Webhook triggers (Slack / Discord check-in notifications)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/rafiksalah">Rafik Salah</a></sub>
</div>
