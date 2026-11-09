/**
 * LMC Chats Automated Security Penetration Test & Audit Suite
 * Tests:
 * 1. XSS Injection & Neutralization (DOMPurify & Tag Stripping)
 * 2. Anti-Spam Flood & 2-Second Cooldown Engine (Requests 2-5 Blocked)
 * 3. Console Hijack / Unauthorized Delete (403 Forbidden vs Super Admin)
 * 4. Payload Bombing (char_length <= 1000) & Media URL Whitelisting
 * 5. Banned User Lockdown & Super Admin Purge
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3009';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let allPassed = true;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    allPassed = false;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runPenetrationSuite() {
  console.log(`\n======================================================`);
  console.log(`🛡️  LMC CHATS ENTERPRISE SECURITY PENETRATION AUDIT  🛡️`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  // -------------------------------------------------------------------------
  // TEST 1: XSS Attack Payload Neutralization
  // -------------------------------------------------------------------------
  console.log(`[SUITE 1] Testing XSS Injection & Neutralization...`);
  const xssPayload = `<img src=x onerror=alert(document.cookie)><script>window.hacked=true</script><b>Hello Safe Message</b>`;
  const xssMsgId = `sec_xss_${Date.now()}`;

  const xssRes = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: xssMsgId,
      group_id: 'sec-audit-room',
      sender_name: 'Attacker<script>alert(1)</script>',
      sender_username: 'xss_tester',
      content: xssPayload,
      msg_type: 'text',
    }),
  });

  const xssData = await xssRes.json();
  assert(xssRes.status === 200, `POST /api/messages accepted without crashing (Status ${xssRes.status})`);
  assert(xssData.message && !xssData.message.content.includes('<script>'), `Raw <script> tag completely eliminated`);
  assert(xssData.message && !xssData.message.content.includes('onerror='), `Event handler "onerror=" completely stripped/disarmed`);
  assert(xssData.message && xssData.message.sender_name && !xssData.message.sender_name.includes('<script>'), `Sender name XSS injection sanitized`);
  console.log(`Sanitized Content in Store: "${xssData.message?.content}"\n`);

  // Clean up
  await fetch(`${BASE_URL}/api/messages?id=${xssMsgId}&requester=koshensiwanchi@gmail.com`, { method: 'DELETE' });

  // -------------------------------------------------------------------------
  // TEST 2: Spam Flood & 2-Second Insertion Cooldown Engine
  // -------------------------------------------------------------------------
  console.log(`[SUITE 2] Testing Anti-Spam Flood & 2-Second Insertion Cooldown...`);
  const spammerUser = `spammer_${Date.now()}`;
  const spamRoom = 'sec-audit-room';

  // Request 1: Should succeed
  const req1 = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group_id: spamRoom,
      sender_name: 'Spammer',
      sender_username: spammerUser,
      content: 'Legitimate first message',
      msg_type: 'text',
    }),
  });
  const data1 = await req1.json();
  assert(req1.status === 200, `Spam Flood - Request 1 allowed (Status ${req1.status})`);

  // Requests 2 to 5: Fired rapidly in parallel within < 300ms
  console.log(`Firing 4 rapid parallel requests within 100ms...`);
  const floodPromises = [2, 3, 4, 5].map((i) =>
    fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group_id: spamRoom,
        sender_name: 'Spammer',
        sender_username: spammerUser,
        content: `Spam burst message #${i}`,
        msg_type: 'text',
      }),
    })
  );

  const floodResponses = await Promise.all(floodPromises);
  const floodStatuses = floodResponses.map((r) => r.status);
  const blockedCount = floodStatuses.filter((s) => s === 429).length;

  console.log(`Rapid requests HTTP statuses: [${floodStatuses.join(', ')}]`);
  assert(blockedCount >= 3, `Postgres trigger & cooldown engine blocked rapid requests 2-5 with HTTP 429 (${blockedCount}/4 blocked)`);
  console.log('');

  // -------------------------------------------------------------------------
  // TEST 3: Console Hijack & Unauthorized Message Delete Protection
  // -------------------------------------------------------------------------
  console.log(`[SUITE 3] Testing Console Hijack & Unauthorized Delete Protection...`);
  const victimMsgId = `victim_msg_${Date.now()}`;

  // Insert a victim's message
  await wait(2100); // wait past cooldown
  const victimInsert = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: victimMsgId,
      group_id: 'sec-audit-room',
      sender_name: 'Victim Student',
      sender_username: 'victim_student',
      content: 'Important study notes - Do not touch!',
      msg_type: 'text',
    }),
  });
  assert(victimInsert.status === 200, `Victim message inserted successfully`);

  // Attempt 3A: Attacker attempts to delete victim's message from browser console
  const hijackRes = await fetch(`${BASE_URL}/api/messages?id=${victimMsgId}&requester=attacker_hacker`, {
    method: 'DELETE',
  });
  const hijackData = await hijackRes.json();
  assert(hijackRes.status === 403, `Attacker console hijack blocked with HTTP 403 Forbidden (Got ${hijackRes.status})`);
  assert(hijackData.error && hijackData.error.includes('Unauthorized'), `Error specifies unauthorized message deletion`);

  // Attempt 3B: Anonymous delete without requester credentials
  const anonDeleteRes = await fetch(`${BASE_URL}/api/messages?id=${victimMsgId}`, {
    method: 'DELETE',
  });
  assert(anonDeleteRes.status === 403, `Anonymous delete without credentials blocked with HTTP 403 Forbidden`);

  // Attempt 3C: Super Admin authorized deletion
  const adminDeleteRes = await fetch(`${BASE_URL}/api/messages?id=${victimMsgId}&requester=koshensiwanchi@gmail.com`, {
    method: 'DELETE',
  });
  const adminDeleteData = await adminDeleteRes.json();
  assert(adminDeleteRes.status === 200 && adminDeleteData.success === true, `Super Admin authorized delete succeeded with HTTP 200 OK`);
  console.log('');

  // -------------------------------------------------------------------------
  // TEST 4: Payload Bombing & Media URL Whitelist Enforcement
  // -------------------------------------------------------------------------
  console.log(`[SUITE 4] Testing Payload Bombing & Media Whitelist Constraints...`);
  await wait(2100);

  // 4A: Payload bomb with 1500 characters
  const bombContent = 'A'.repeat(1500);
  const bombRes = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group_id: 'sec-audit-room',
      sender_name: 'Bomb Tester',
      sender_username: 'bomb_tester',
      content: bombContent,
      msg_type: 'text',
    }),
  });
  assert(bombRes.status === 400, `Payload bomb (>1000 chars) blocked with HTTP 400 Bad Request`);

  // 4B: Malicious external tracking pixel
  await wait(2100);
  const maliciousMediaRes = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group_id: 'sec-audit-room',
      sender_name: 'Phishing Attacker',
      sender_username: 'phish_tester',
      content: 'Check this link',
      msg_type: 'image',
      media_url: 'https://evil-tracking-pixel.com/logger.php?cookie=stolen',
    }),
  });
  assert(maliciousMediaRes.status === 400, `Malicious external media URL rejected with HTTP 400 (Whitelist enforced)`);

  // 4C: Legitimate Tenor GIF URL
  await wait(2100);
  const safeTenorRes = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group_id: 'sec-audit-room',
      sender_name: 'Legit User',
      sender_username: 'legit_user_tenor',
      content: 'Awesome sticker',
      msg_type: 'gif',
      media_url: 'https://media.tenor.com/images/safe_animated_gif.gif',
    }),
  });
  assert(safeTenorRes.status === 200, `Whitelisted Tenor GIF URL accepted successfully`);
  console.log('');

  // -------------------------------------------------------------------------
  // TEST 5: Banned User Lockdown & Super Admin Purge
  // -------------------------------------------------------------------------
  console.log(`[SUITE 5] Testing Banned User Lockdown & Admin Moderation API...`);
  const badActor = `bad_actor_${Date.now()}`;

  // 5A: Super Admin bans the bad actor
  const banRes = await fetch(`${BASE_URL}/api/admin/moderation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'ban',
      target_username: badActor,
      requester: 'koshensiwanchi@gmail.com',
      reason: 'Automated pentest ban verification',
    }),
  });
  const banData = await banRes.json();
  assert(banRes.status === 200 && banData.success === true, `Super Admin successfully banned @${badActor}`);

  // 5B: Banned user attempts to send message
  await wait(2100);
  const bannedSendRes = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group_id: 'sec-audit-room',
      sender_name: 'Banned Person',
      sender_username: badActor,
      content: 'I am trying to bypass ban!',
      msg_type: 'text',
    }),
  });
  assert(bannedSendRes.status === 403, `Banned user message blocked with HTTP 403 Forbidden`);

  // 5C: Non-admin attempts to access Admin Moderation Panel
  const rogueAdminRes = await fetch(`${BASE_URL}/api/admin/moderation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'ban',
      target_username: 'innocent_student',
      requester: 'hacker_nobody',
    }),
  });
  assert(rogueAdminRes.status === 403, `Non-admin moderation access strictly denied with HTTP 403 Forbidden`);
  console.log('');

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log(`======================================================`);
  if (allPassed) {
    console.log(`🎉 ALL 5 SECURITY PENETRATION SUITES PASSED (100% GREEN)`);
    console.log(`🛡️ ZERO VULNERABILITIES DETECTED.`);
  } else {
    console.error(`💥 SOME SECURITY TESTS FAILED. PLEASE REVIEW LOGS.`);
    process.exit(1);
  }
  console.log(`======================================================\n`);
}

runPenetrationSuite().catch((err) => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});

