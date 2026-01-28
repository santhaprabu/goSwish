
import { getUserByEmail } from './src/storage/index.js';

async function checkUser() {
    try {
        const email = 'cleaner1@goswish.com';
        console.log(`Checking for user: ${email}`);
        const user = await getUserByEmail(email);

        if (user) {
            console.log('✅ User found:', user);
            console.log('Role:', user.role);
            console.log('Password (stored):', user.password); // In this mock DB, passwords might be stored directly or accessible
        } else {
            console.log('❌ User not found');
        }
    } catch (error) {
        console.error('Error checking user:', error);
    }
}

checkUser();
