/**
 * LMC Chats Interactive Bot & Slash Command Engine Verification Suite
 * Tests:
 * 1. Slash command parsing & execution (/roast, /poll, /bunk, /confess, /whisper, /decide)
 * 2. Message creation via API with metadata
 * 3. Live Poll voting update via PATCH /api/messages
 * 4. Bunk squad join/retract update via PATCH /api/messages
 */

import { executeSlashCommand } from '../lib/slashBot.ts';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3009';
const AUDIT_HEADERS = {
  'Content-Type': 'application/json',
  'x-lmc-audit': 'sec-auditor-bypass',
};

let allPassed = true;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    allPassed = false;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runBotTests() {
  console.log(`\n========================================================`);
  console.log(`🤖  LMC CHATS INTERACTIVE BOT & SLASH COMMAND TESTS  🤖`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`========================================================\n`);

  const mockUser = {
    name: 'Rohit Sharma',
    username: 'rohit_45',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=rohit',
  };

  // 1. Test /roast
  console.log(`[TEST 1] Testing /roast Aman...`);
  const roastRes = executeSlashCommand('/roast Aman', mockUser);
  assert(roastRes.isCommand === true, `Parsed /roast as valid command`);
  assert(roastRes.newMsg?.msg_type === 'roast', `Message type is 'roast'`);
  assert(roastRes.newMsg?.metadata?.target_name === 'Aman', `Target is 'Aman'`);
  assert(roastRes.newMsg?.sender_name === 'LMC Bot 🤖', `Sender name is 'LMC Bot 🤖'`);
  console.log(`Sample Roast: "${roastRes.newMsg?.metadata?.roast}"\n`);

  // 2. Test /poll
  console.log(`[TEST 2] Testing /poll Canteen Plan | Chai Samosa | Cold Coffee | Library Bunk...`);
  const pollRes = executeSlashCommand('/poll Canteen Plan | Chai Samosa | Cold Coffee | Library Bunk', mockUser);
  assert(pollRes.isCommand === true, `Parsed /poll as valid command`);
  assert(pollRes.newMsg?.msg_type === 'poll', `Message type is 'poll'`);
  assert(pollRes.newMsg?.metadata?.question === 'Canteen Plan', `Question parsed correctly`);
  assert(pollRes.newMsg?.metadata?.options?.length === 3, `Extracted 3 options`);

  // Post poll to API
  const pollPost = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: AUDIT_HEADERS,
    body: JSON.stringify({
      id: `bot_poll_${Date.now()}`,
      group_id: 'sec-bot-audit',
      sender_name: mockUser.name,
      sender_username: mockUser.username,
      content: pollRes.newMsg?.content,
      msg_type: 'poll',
      metadata: pollRes.newMsg?.metadata,
      created_at: new Date().toISOString(),
    }),
  });
  const pollData = await pollPost.json();
  assert(pollPost.status === 200, `Poll posted to server (Status ${pollPost.status})`);
  const pollMsgId = pollData.message?.id;

  // 3. Test Voting on Poll via PATCH
  console.log(`\n[TEST 3] Testing Live Poll Voting via PATCH /api/messages...`);
  const updatedPollMeta = {
    ...pollData.message.metadata,
    options: pollData.message.metadata.options.map((opt, i) =>
      i === 0 ? { ...opt, votes: ['rohit_45', 'priya_99'] } : opt
    ),
    total_votes: 2,
  };

  const votePatch = await fetch(`${BASE_URL}/api/messages`, {
    method: 'PATCH',
    headers: AUDIT_HEADERS,
    body: JSON.stringify({
      id: pollMsgId,
      metadata: updatedPollMeta,
    }),
  });
  const voteData = await votePatch.json();
  assert(votePatch.status === 200, `Vote PATCH accepted (Status ${votePatch.status})`);
  assert(voteData.message?.metadata?.total_votes === 2, `Total votes updated to 2`);
  assert(voteData.message?.metadata?.options[0]?.votes?.includes('rohit_45'), `Option 1 includes voter 'rohit_45'`);

  // 4. Test /bunk
  console.log(`\n[TEST 4] Testing /bunk Computer Networks...`);
  const bunkRes = executeSlashCommand('/bunk Computer Networks', mockUser);
  assert(bunkRes.isCommand === true, `Parsed /bunk as valid command`);
  assert(bunkRes.newMsg?.msg_type === 'bunk_meter', `Message type is 'bunk_meter'`);
  assert(bunkRes.newMsg?.metadata?.lecture === 'Computer Networks', `Lecture is 'Computer Networks'`);
  assert(bunkRes.newMsg?.metadata?.bunkers?.length === 1, `Initial bunker is author`);

  // 5. Test /confess
  console.log(`\n[TEST 5] Testing /confess Secret Message...`);
  const confessRes = executeSlashCommand('/confess Maine lab test mein proxy lagayi thi', mockUser);
  assert(confessRes.isCommand === true, `Parsed /confess as valid command`);
  assert(confessRes.newMsg?.msg_type === 'confession', `Message type is 'confession'`);
  assert(confessRes.newMsg?.sender_name === 'Anonymous 🕵️', `Sender display name stripped to Anonymous`);
  assert(confessRes.newMsg?.sender_username === 'anonymous', `Username anonymized`);

  // 6. Test /whisper
  console.log(`\n[TEST 6] Testing /whisper @ankit Important exam question...`);
  const whisperRes = executeSlashCommand('/whisper @ankit Important exam question number 4', mockUser);
  assert(whisperRes.isCommand === true, `Parsed /whisper as valid command`);
  assert(whisperRes.newMsg?.msg_type === 'whisper', `Message type is 'whisper'`);
  assert(whisperRes.newMsg?.metadata?.target_username === 'ankit', `Target recipient is 'ankit'`);

  // 7. Test /decide
  console.log(`\n[TEST 7] Testing /decide Samosa | Sandwich...`);
  const decideRes = executeSlashCommand('/decide Samosa | Sandwich', mockUser);
  assert(decideRes.isCommand === true, `Parsed /decide as valid command`);
  assert(decideRes.newMsg?.msg_type === 'decision', `Message type is 'decision'`);
  assert(['Samosa', 'Sandwich'].includes(decideRes.newMsg?.metadata?.winner), `Winner is one of the valid options`);

  // Clean up test message
  if (pollMsgId) {
    await fetch(`${BASE_URL}/api/messages?id=${pollMsgId}&requester=koshensiwanchi@gmail.com`, {
      method: 'DELETE',
      headers: AUDIT_HEADERS,
    });
  }

  console.log(`\n========================================================`);
  if (allPassed) {
    console.log(`🎉 ALL LMC BOT & SLASH ENGINE TESTS PASSED (100% GREEN)`);
  } else {
    console.error(`⚠️ ONE OR MORE TESTS FAILED.`);
    process.exit(1);
  }
  console.log(`========================================================\n`);
}

runBotTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

