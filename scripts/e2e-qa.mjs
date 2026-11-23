import puppeteer from 'puppeteer-core';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const TEST_EMAIL = `qa.organizer.${Date.now()}@swiftinvite.test`;
const TEST_PASSWORD = 'Password123!';

async function runQASuite() {
  console.log('========================================================');
  console.log('🚀 STARTING SWIFTINVITE COMPREHENSIVE QA TEST SUITE');
  console.log(`Target: ${APP_URL}`);
  console.log(`Chrome Executable: ${CHROME_PATH}`);
  console.log('========================================================\n');

  const testResults = [];
  const consoleErrors = [];

  function recordResult(name, passed, details = '') {
    testResults.push({ name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [${name}] ${details}`);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--remote-allow-origins=*'
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore known benign camera permission rejection in headless mode
      if (!text.includes('getUserMedia') && !text.includes('NotFoundAppError')) {
        consoleErrors.push(`[Console Error] ${text}`);
      }
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`[Page Error] ${err.message}`);
  });

  let eventId = null;
  let aliceInvitationId = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Landing Page
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Landing Page ---');
    await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle2' });
    const pageTitle = await page.title();
    const hasHero = await page.$eval('h1', (el) => el.textContent.length > 0).catch(() => false);
    const getStartedLink = await page.$('a[href="/auth/register"]');

    recordResult(
      'Landing Page Load & Hero CTA',
      hasHero && !!getStartedLink,
      `Title: "${pageTitle}", Hero present: ${hasHero}, Register CTA: ${!!getStartedLink}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Organizer Registration
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Organizer Registration ---');
    await page.goto(`${APP_URL}/auth/register`, { waitUntil: 'networkidle2' });

    await page.type('input[type="email"]', TEST_EMAIL);
    const passwordInputs = await page.$$('input[type="password"]');
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].type(TEST_PASSWORD);
      await passwordInputs[1].type(TEST_PASSWORD);
    } else if (passwordInputs.length === 1) {
      await passwordInputs[0].type(TEST_PASSWORD);
    }

    // Submit form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);

    const postRegisterUrl = page.url();
    const isDashboard = postRegisterUrl.includes('/dashboard');

    recordResult(
      'Organizer Registration & Redirect',
      isDashboard,
      `Target URL: ${postRegisterUrl} (User: ${TEST_EMAIL})`
    );

    // If not on dashboard, attempt login fallback
    if (!isDashboard) {
      console.log('Attempting login fallback...');
      await page.goto(`${APP_URL}/auth/login`, { waitUntil: 'networkidle2' });
      await page.type('input[type="email"]', TEST_EMAIL);
      await page.type('input[type="password"]', TEST_PASSWORD);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
        page.click('button[type="submit"]'),
      ]);
      recordResult(
        'Organizer Login Fallback',
        page.url().includes('/dashboard'),
        `Post-login URL: ${page.url()}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 3: Dashboard View
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Dashboard Overview ---');
    await page.goto(`${APP_URL}/dashboard`, { waitUntil: 'networkidle2' });
    const hasCreateBtn = await page.$('a[href="/events/new"]');
    recordResult(
      'Dashboard & Create Event Button',
      !!hasCreateBtn,
      `Create button found: ${!!hasCreateBtn}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Event Creation
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Event Creation Flow ---');
    await page.goto(`${APP_URL}/events/new`, { waitUntil: 'networkidle2' });

    // Fill Title
    await page.waitForSelector('input[placeholder*="Annual Tech Founders"]');
    await page.type('input[placeholder*="Annual Tech Founders"]', 'Global Tech Summit 2026');

    // Fill Description
    const textareaDesc = await page.$('textarea[placeholder*="special instructions"]');
    if (textareaDesc) {
      await textareaDesc.type('Annual technology keynote and VIP networking reception.');
    }

    // Fill Location
    const inputLocation = await page.$('input[placeholder*="Skylight Loft"]');
    if (inputLocation) {
      await inputLocation.type('Moscone West Center, San Francisco, CA');
    }

    // Fill Attendee Emails
    const textareaGuests = await page.$('textarea[placeholder*="alex@startup.io"]');
    if (textareaGuests) {
      await textareaGuests.type('alice@techcorp.com, bob@startup.io\ncarol@developer.org');
    }

    // Give state machine a moment to parse the emails and enable button
    await new Promise((r) => setTimeout(r, 600));

    // Submit form and wait for redirect to /events/[id]
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
      page.click('button[type="submit"]'),
    ]);

    const createdEventUrl = page.url();
    const eventMatch = createdEventUrl.match(/\/events\/([a-zA-Z0-9_-]+)/);
    if (eventMatch && eventMatch[1] !== 'new') {
      eventId = eventMatch[1];
    }

    recordResult(
      'Create Event with Multi-line Attendees',
      !!eventId,
      `Created Event ID: ${eventId}, URL: ${createdEventUrl}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Event Details & Guest Roster Management
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Event Details & Guest Management ---');
    await page.goto(`${APP_URL}/events/${eventId}`, { waitUntil: 'networkidle2' });

    const pageText = await page.evaluate(() => document.body.innerText);
    const hasTitle = pageText.includes('Global Tech Summit 2026');
    const hasAlice = pageText.includes('alice@techcorp.com');
    const hasBob = pageText.includes('bob@startup.io');
    const hasCarol = pageText.includes('carol@developer.org');

    recordResult(
      'Event Overview & Initial Roster',
      hasTitle && hasAlice && hasBob && hasCarol,
      `Roster contains all 3 initial attendees: alice=${hasAlice}, bob=${hasBob}, carol=${hasCarol}`
    );

    // Test Search filter
    const searchInput = await page.$('input[placeholder*="Search guests"]');
    if (searchInput) {
      await searchInput.type('alice');
      await new Promise((r) => setTimeout(r, 400));
      const afterSearchText = await page.evaluate(() => document.body.innerText);
      const searchWorks =
        afterSearchText.includes('alice@techcorp.com') && !afterSearchText.includes('bob@startup.io');
      recordResult(
        'Client-side Guest Search Filter',
        searchWorks,
        `Filtered to Alice: ${searchWorks}`
      );

      // Cleanly reset search filter completely using DOM value & event
      await page.$eval('input[placeholder*="Search guests"]', (el) => {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await new Promise((r) => setTimeout(r, 400));
    }

    // Test "Add More Guests" modal
    const addBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent.includes('Add Guests')) || null;
    });

    if (addBtn && addBtn.asElement()) {
      await addBtn.asElement().click();
      await page.waitForSelector('textarea[placeholder*="charlie@example.com"]');
      await page.type('textarea[placeholder*="charlie@example.com"]', 'david@cloud.net');

      // Click "Add & Send Passes"
      const submitAddBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent.includes('Add & Send Passes')) || null;
      });

      if (submitAddBtn && submitAddBtn.asElement()) {
        await submitAddBtn.asElement().click();
        // Wait for modal to complete, refresh API, and david to appear in guest table
        await page.waitForFunction(
          () => document.body.innerText.includes('david@cloud.net'),
          { timeout: 10000 }
        ).catch(() => {});
      }
    }

    // Reload event page to ensure state sync from database
    await page.goto(`${APP_URL}/events/${eventId}`, { waitUntil: 'networkidle2' });
    const updatedText = await page.evaluate(() => document.body.innerText);
    const hasDavid = updatedText.includes('david@cloud.net');
    recordResult(
      'Dynamic Guest Addition Modal',
      hasDavid,
      `Added david@cloud.net into existing roster: ${hasDavid}`
    );

    // Extract Alice's ticket UUID from table links
    const ticketLinks = await page.$$eval('a[href*="/verify/"]', (links) =>
      links.map((l) => l.getAttribute('href'))
    );

    if (ticketLinks.length > 0) {
      const match = ticketLinks[0].match(/\/verify\/([a-zA-Z0-9_-]+)/);
      if (match) {
        aliceInvitationId = match[1];
      }
    }

    recordResult(
      'Ticket Pass Link Resolution',
      !!aliceInvitationId,
      `Alice Ticket UUID: ${aliceInvitationId}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Public Ticket Pass View (/verify/[uuid])
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Public Ticket Pass View ---');
    await page.goto(`${APP_URL}/verify/${aliceInvitationId}`, { waitUntil: 'networkidle2' });

    const ticketPageText = await page.evaluate(() => document.body.innerText);
    const hasTicketTitle = ticketPageText.includes('Global Tech Summit 2026');
    const hasValidBadge = ticketPageText.includes('Valid Pass');
    const hasQRImage = await page.$('img[alt*="QR Code"], img[src*="qrserver"]');

    recordResult(
      'Public Ticket Pass Rendering & QR Code',
      hasTicketTitle && hasValidBadge && !!hasQRImage,
      `Title: ${hasTicketTitle}, Status: Valid Pass (${hasValidBadge}), QR Image: ${!!hasQRImage}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Gate Scanner & Admission Verification
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Gate Scanner & Admission Validation ---');
    await page.goto(`${APP_URL}/events/${eventId}/scan`, { waitUntil: 'networkidle2' });

    // Open Manual Code Entry form
    const manualToggleBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return (
        btns.find(
          (b) =>
            b.textContent.includes('manually') ||
            b.textContent.includes('Manual') ||
            b.textContent.includes('Keyboard')
        ) || null
      );
    });

    if (manualToggleBtn && manualToggleBtn.asElement()) {
      await manualToggleBtn.asElement().click();
      await page.waitForSelector('input[placeholder*="ticket UUID"]', { timeout: 3000 });
    }

    // Input Alice's UUID
    const manualInput = await page.$('input[placeholder*="ticket UUID"]');
    if (manualInput) {
      await manualInput.type(aliceInvitationId);
      const submitScanBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent.trim() === 'Verify') || null;
      });

      if (submitScanBtn && submitScanBtn.asElement()) {
        await submitScanBtn.asElement().click();
      }
    }

    // Wait for the admission feedback to appear
    const isSuccess = await page.waitForFunction(() => {
      const text = document.body.innerText;
      return (
        text.includes('WELCOME!') ||
        text.includes('checked in successfully') ||
        text.includes('1 / 4') ||
        !!document.querySelector('.bg-emerald-600')
      );
    }, { timeout: 8000 }).then(() => true).catch(() => false);

    recordResult(
      'Gate Admission: Valid Ticket Check-in',
      isSuccess,
      `Instant admission granted feedback displayed: ${isSuccess}`
    );

    // Anti-Passback Duplicate Test: Submit Alice's UUID directly through the page session
    console.log('\n--- Testing Anti-Passback Duplicate Scan ---');
    const dupResponse = await page.evaluate(async (uuid) => {
      const res = await fetch(`/api/verify/${uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.json();
    }, aliceInvitationId);

    const isDuplicate = dupResponse?.status === 'duplicate' && dupResponse?.message?.includes('DUPLICATE TICKET');

    recordResult(
      'Gate Admission: Anti-Passback Duplicate Detection',
      isDuplicate,
      `Server response: status="${dupResponse?.status}", message="${dupResponse?.message}"`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Mobile Viewport Responsiveness (375x812)
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing Mobile Responsiveness (375x812) ---');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

    const routesToCheck = [
      { name: 'Landing Page', url: `${APP_URL}/` },
      { name: 'Dashboard', url: `${APP_URL}/dashboard` },
      { name: 'Event Overview', url: `${APP_URL}/events/${eventId}` },
      { name: 'Ticket Pass', url: `${APP_URL}/verify/${aliceInvitationId}` },
      { name: 'Gate Scanner', url: `${APP_URL}/events/${eventId}/scan` },
    ];

    for (const route of routesToCheck) {
      await page.goto(route.url, { waitUntil: 'networkidle2' });
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 2;
      });
      recordResult(
        `Mobile Viewport (${route.name})`,
        !overflow,
        `Width 375px: Horizontal Overflow = ${overflow}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 9: Console & Network Integrity
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Inspecting Console & Runtime Integrity ---');
    recordResult(
      'Runtime Console Integrity',
      consoleErrors.length === 0,
      consoleErrors.length === 0
        ? 'Zero critical runtime errors'
        : `Captured errors: ${consoleErrors.join('; ')}`
    );
  } catch (err) {
    console.error('Test execution error:', err);
    recordResult('Test Suite Execution', false, err.message);
  } finally {
    await browser.close();
  }

  // Summary Report
  console.log('\n========================================================');
  console.log('📊 QA TEST SUITE EXECUTION SUMMARY');
  console.log('========================================================');
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;

  console.log(`Total Tests: ${total}`);
  console.log(`Passed:      ${passed}`);
  console.log(`Failed:      ${failed}`);
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);

  if (consoleErrors.length > 0) {
    console.log('\nConsole Errors Logged:');
    consoleErrors.forEach((e) => console.log(`  - ${e}`));
  }

  return { total, passed, failed, results: testResults, consoleErrors };
}

runQASuite()
  .then((summary) => {
    if (summary.failed > 0) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
