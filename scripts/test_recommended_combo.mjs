// Test script for Recommended Combo (Typing, Double Ticks / Read Receipts, Quoted Reply, Voice Notes)
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🧪 Starting Phase 1 (Recommended Combo) Verification...\n');

  // 1. Test Typing API
  console.log('--- Test 1: Typing Indicator ---');
  const typeRes = await fetch(`${BASE_URL}/api/typing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group_id: 'general',
      username: 'alice',
      name: 'Alice Cooper',
      is_typing: true
    })
  });
  const typeData = await typeRes.json();
  console.log('POST /api/typing status:', typeRes.status, typeData);

  const getTypingRes = await fetch(`${BASE_URL}/api/typing?group_id=general`);
  const getTypingData = await getTypingRes.json();
  console.log('GET /api/typing response:', getTypingData);
  if (getTypingData.typers && getTypingData.typers.some(t => t.username === 'alice')) {
    console.log('✅ Typing indicator successfully verified in memory store!\n');
  } else {
    throw new Error('Typing indicator verification failed');
  }

  // 2. Test Quoted Reply Message
  console.log('--- Test 2: Quoted Reply Message ---');
  const parentMsgRes = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group_id: 'general',
      sender_name: 'Bob',
      sender_username: 'bob',
      content: 'Hello everyone!',
      msg_type: 'text'
    })
  });
  const parentMsgData = await parentMsgRes.json();
  const parentMsg = parentMsgData.message;
  console.log('Parent message created:', parentMsg.id);

  const replyMsgRes = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group_id: 'general',
      sender_name: 'Alice',
      sender_username: 'alice',
      content: 'Replying to Bob!',
      msg_type: 'text',
      reply_to: {
        id: parentMsg.id,
        sender_name: parentMsg.sender_name,
        sender_username: parentMsg.sender_username,
        content: parentMsg.content,
        msg_type: parentMsg.msg_type
      }
    })
  });
  const replyMsgData = await replyMsgRes.json();
  const replyMsg = replyMsgData.message;
  console.log('Reply message created:', replyMsg.id, 'with reply_to:', replyMsg.reply_to);
  if (replyMsg.reply_to && replyMsg.reply_to.id === parentMsg.id) {
    console.log('✅ Quoted Reply attached and returned accurately!\n');
  } else {
    throw new Error('Quoted reply verification failed');
  }

  // 3. Test Voice Note Message (Audio memo)
  console.log('--- Test 3: Voice Note / Audio Memo ---');
  const voiceMsgRes = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group_id: 'general',
      sender_name: 'Alice',
      sender_username: 'alice',
      content: 'Voice note (0:05)',
      msg_type: 'audio',
      media_url: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8='
    })
  });
  const voiceMsgData = await voiceMsgRes.json();
  const voiceMsg = voiceMsgData.message;
  console.log('Voice note created:', voiceMsg.id, 'type:', voiceMsg.msg_type);
  if (voiceMsg.msg_type === 'audio' && voiceMsg.media_url) {
    console.log('✅ Voice note audio memo successfully stored and verified!\n');
  } else {
    throw new Error('Voice note verification failed');
  }

  // 4. Test Read Receipts (Double Blue Ticks)
  console.log('--- Test 4: Read Receipts (Mark Read) ---');
  console.log('Sender (Alice) read_by initial:', voiceMsg.read_by);
  const markReadRes = await fetch(`${BASE_URL}/api/messages`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'mark_read',
      group_id: 'general',
      reader: 'bob'
    })
  });
  const markReadData = await markReadRes.json();
  console.log('PATCH /api/messages mark_read result:', markReadData);

  const getGeneralMsgsRes = await fetch(`${BASE_URL}/api/messages?group_id=general`);
  const getGeneralMsgsData = await getGeneralMsgsRes.json();
  const updatedVoiceMsg = getGeneralMsgsData.messages.find(m => m.id === voiceMsg.id);
  console.log('Updated message read_by:', updatedVoiceMsg?.read_by);
  if (updatedVoiceMsg && updatedVoiceMsg.read_by?.includes('bob')) {
    console.log('✅ Double Blue Tick Read Receipts verified! Reader "bob" added to read_by!\n');
  } else {
    throw new Error('Read receipt verification failed');
  }

  console.log('🎉 ALL PHASE 1 (RECOMMENDED COMBO) TESTS PASSED 100%!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
