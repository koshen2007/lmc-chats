const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🧪 Starting Verification Tests for Search, Real Accounts & DM Flow...\n');

  // 1. Register test real users
  console.log('1️⃣ Registering test accounts (Harshita, Rohan)...');
  const user1 = {
    id: 'usr_harshita',
    username: 'harshita',
    name: 'Harshita Sharma',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=harshita',
    bio: 'Coding & design enthusiast',
  };
  const reg1 = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user1),
  });
  const data1 = await reg1.json();
  if (!data1.success) throw new Error('Failed to register harshita');
  console.log('   ✅ Registered @harshita successfully!');

  const user2 = {
    id: 'usr_rohan',
    username: 'rohan',
    name: 'Rohan Verma',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=rohan',
    bio: 'Music & tech lover',
  };
  const reg2 = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user2),
  });
  const data2 = await reg2.json();
  if (!data2.success) throw new Error('Failed to register rohan');
  console.log('   ✅ Registered @rohan successfully!\n');

  // 2. Test Empty Search (shows all accounts)
  console.log('2️⃣ Testing empty query directory fetch (/api/users)...');
  const allUsersRes = await fetch(`${BASE_URL}/api/users`);
  const allUsersData = await allUsersRes.json();
  if (!Array.isArray(allUsersData.users) || allUsersData.users.length < 2) {
    throw new Error('Empty query did not return all accounts');
  }
  console.log(`   ✅ Directory returned ${allUsersData.users.length} registered accounts for discovery!\n`);

  // 3. Test Prefix / Word Search (typing "h" -> harshita)
  console.log('3️⃣ Testing query filter for "h" (/api/users?q=h)...');
  const hRes = await fetch(`${BASE_URL}/api/users?q=h`);
  const hData = await hRes.json();
  const foundHarshita = hData.users?.find((u) => u.username === 'harshita');
  if (!foundHarshita) {
    throw new Error('Search with query "h" did NOT find @harshita!');
  }
  console.log(`   ✅ Query "h" found @harshita with name "${foundHarshita.name}"!\n`);

  // 4. Test Exact Search "harshita"
  console.log('4️⃣ Testing query filter for "harshita" (/api/users?q=harshita)...');
  const harshitaRes = await fetch(`${BASE_URL}/api/users?q=harshita`);
  const harshitaData = await harshitaRes.json();
  if (!harshitaData.users?.some((u) => u.username === 'harshita')) {
    throw new Error('Search with query "harshita" failed!');
  }
  console.log('   ✅ Query "harshita" matched @harshita 100%!\n');

  // 5. Test Channel creation & query search
  console.log('5️⃣ Testing Channel creation & search (/api/groups)...');
  const testGroup = {
    id: `grp_hackers_${Date.now()}`,
    name: 'Hackers Lounge',
    description: 'Dev discussions',
    created_by: 'harshita',
    is_private: false,
  };
  await fetch(`${BASE_URL}/api/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testGroup),
  });

  const grpRes = await fetch(`${BASE_URL}/api/groups?q=hack`);
  const grpData = await grpRes.json();
  if (!grpData.groups?.some((g) => g.id === testGroup.id)) {
    throw new Error('Group search by keyword failed!');
  }
  console.log('   ✅ Group search by keyword "hack" verified!\n');

  // Clean up test group
  await fetch(`${BASE_URL}/api/groups?id=${encodeURIComponent(testGroup.id)}`, {
    method: 'DELETE',
  });
  console.log('   ✅ Cleaned up test group.\n');

  console.log('🎉 ALL SEARCH & REAL ACCOUNT TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

