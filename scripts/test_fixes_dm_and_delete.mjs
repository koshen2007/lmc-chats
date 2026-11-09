const BASE_URL = 'http://localhost:3000';

async function verifyFixes() {
  console.log('🧪 Verifying Fixes for DM Mode, Message Glitch & Group Delete...\n');

  // 1. Test Group Creation & Deletion
  console.log('1️⃣  Testing Group Creation & Deletion API...');
  const newGroupRes = await fetch(`${BASE_URL}/api/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `grp-test-${Date.now()}`,
      name: 'Temp Test Squad',
      description: 'Will be deleted',
      avatar: '/logo.png',
      created_by: 'koshen',
      is_private: false,
    }),
  });
  const newGroupData = await newGroupRes.json();
  const createdGroupId = newGroupData.group?.id;
  console.log(`   Created test group: ${createdGroupId}`);

  // Test Delete Group
  const delRes = await fetch(`${BASE_URL}/api/groups?id=${encodeURIComponent(createdGroupId)}`, {
    method: 'DELETE',
  });
  const delData = await delRes.json();
  if (!delData.success) throw new Error('DELETE /api/groups failed');
  const checkGroups = await (await fetch(`${BASE_URL}/api/groups`)).json();
  if (checkGroups.groups?.some((g) => g.id === createdGroupId)) {
    throw new Error('Group still exists after delete');
  }
  console.log('   ✅ Group deleted successfully from server API!\n');

  // 2. Test 1-on-1 Direct Message (DM)
  console.log('2️⃣  Testing Direct Message (DM) Persistence...');
  const dmRoom = 'dm_koshen_priya';
  const dmMsgRes = await fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group_id: dmRoom,
      sender_name: 'Priya',
      sender_username: 'priya',
      content: 'Hey Koshen, can you see my message?',
      msg_type: 'text',
    }),
  });
  const dmMsgData = await dmMsgRes.json();
  const msgId = dmMsgData.message?.id;
  console.log(`   Created DM message: ${msgId} in room: ${dmRoom}`);

  // Fetch DM messages
  const fetchDmRes = await fetch(`${BASE_URL}/api/messages?group_id=${encodeURIComponent(dmRoom)}`);
  const fetchDmData = await fetchDmRes.json();
  const foundDmMsg = fetchDmData.messages?.find((m) => m.id === msgId);
  if (!foundDmMsg || foundDmMsg.content !== 'Hey Koshen, can you see my message?') {
    throw new Error('DM message could not be retrieved from server');
  }
  console.log(`   ✅ DM message verified: "${foundDmMsg.content}"`);

  console.log('\n🎉 ALL FIXES VERIFIED 100% GREEN!');
}

verifyFixes().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
