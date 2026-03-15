require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const API_URL = 'http://localhost:3001/api';

async function runQaTests() {
  console.log('--- STARTING QA TESTS ---');
  let token = null;

  try {
    console.log('1. Testing Authentication (Valid Login)');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.MANAGER_EMAIL || 'murat@cumhuriyet.com',
        password: process.env.MANAGER_PASSWORD || 'manager123'
      })
    });
    const loginData = await loginRes.json();
    if (!loginData.token) throw new Error('No token returned');
    token = loginData.token;
    console.log('✅ Auth Login passed');

    console.log('\n2. Testing Authentication (Invalid Login)');
    const invalidRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid@cumhuriyet.com', password: 'wrong' })
    });
    if (invalidRes.status === 401) {
      console.log('✅ Invalid Login correctly rejected (401)');
    } else {
      throw new Error('Should have failed with 401');
    }

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    console.log('\n3. Testing /api/timeline (Public GET)');
    const timelineRes = await (await fetch(`${API_URL}/timeline`)).json();
    if (!Array.isArray(timelineRes)) throw new Error('Timeline is not array');
    console.log(`✅ Timeline returned ${timelineRes.length} records`);

    console.log('\n4. Testing /api/expenses (Protected GET)');
    const expensesRes = await (await fetch(`${API_URL}/expenses`, { headers })).json();
    if (!expensesRes.data) throw new Error('Expenses format incorrect');
    console.log(`✅ Expenses returned ${expensesRes.data.length} records`);

    console.log('\n5. Testing /api/apartments (Protected GET & PUT)');
    const aptsRes = await (await fetch(`${API_URL}/apartments`, { headers })).json();
    if (aptsRes.length !== 18) throw new Error(`Expected 18 apartments, got ${aptsRes.length}`);
    console.log('✅ Apartments listing passed');
    
    // Test PUT
    const firstApt = aptsRes[0];
    const updateRes = await (await fetch(`${API_URL}/apartments/${firstApt.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ ...firstApt, notes: 'QA Test Note' })
    })).json();
    if (!updateRes.success) throw new Error('Failed to update apartment');
    console.log('✅ Apartment PUT passed');

    console.log('\n6. Testing /api/aidats (Protected GET)');
    const aidatsRes = await (await fetch(`${API_URL}/aidats`, { headers })).json();
    if (!Array.isArray(aidatsRes)) throw new Error('Aidats not an array');
    console.log('✅ Aidats returned data');

    console.log('\n7. Testing /api/meetings (Protected GET)');
    const meetingsRes = await (await fetch(`${API_URL}/meetings`, { headers })).json();
    if (!Array.isArray(meetingsRes.data)) throw new Error('Meetings not an array');
    console.log(`✅ Meetings returned ${meetingsRes.data.length} records`);
    
    console.log('\n--- ALL QA TESTS PASSED ---');
  } catch (error) {
    console.error('\n❌ QA TEST FAILED:');
    console.error(error.message);
  }
}

runQaTests().then(() => process.exit(0)).catch(e => process.exit(1));
