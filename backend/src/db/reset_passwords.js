const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client');
const path = require('path');

const client = createClient({
  url: 'file:data/apartment.db'
});

const users = [
  { email: 'murat@cumhuriyet.com', password: '3434murat' },
  { email: 'kutluhan@cumhuriyet.com', password: '095321Admin.' }
];

async function updatePasswords() {
  try {
    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10);
      await client.execute({
        sql: 'UPDATE users SET password_hash = ? WHERE email = ?',
        args: [hash, user.email]
      });
      console.log(`✅ Updated password for ${user.email}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error updating passwords:', err);
    process.exit(1);
  }
}

updatePasswords();
