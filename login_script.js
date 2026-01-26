import { signInWithEmail } from './src/storage/auth.js';

async function main() {
    try {
        const result = await signInWithEmail('customer1@goswish.com', 'Customer123!');
        console.log('Login result:', result);
    } catch (error) {
        console.error('Error during login script:', error);
    }
}

main();
