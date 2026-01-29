
import { COLLECTIONS, getDocs, setDoc } from './db.js';

const MALE_NAMES = new Set([
    'James', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher',
    'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Paul', 'Steven', 'Andrew', 'Kenneth', 'Joshua', 'Kevin',
    'Brian', 'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas',
    'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Gregory',
    'Frank', 'Alexander', 'Raymond', 'Patrick', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron', 'Jose', 'Adam',
    'Nathan', 'Henry', 'Douglas', 'Zachary', 'Peter', 'Kyle', 'Walter', 'Ethan', 'Jeremy', 'Harold', 'Keith',
    'Christian', 'Roger', 'Terry', 'Sean', 'Austin', 'Carl', 'Arthur', 'Lawrence', 'Dylan', 'Jesse', 'Jordan',
    'Bryan', 'Billy', 'Joe', 'Bruce', 'Gabriel', 'Logan', 'Albert', 'Willie', 'Alan', 'Juan', 'Wayne', 'Elijah',
    'Randy', 'Roy', 'Vincent', 'Ralph', 'Eugene', 'Russell', 'Bobby', 'Mason', 'Philip', 'Louis'
]);

const FEMALE_NAMES = new Set([
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
    'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
    'Dorothy', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
    'Kathleen', 'Amy', 'Shirley', 'Angela', 'Helen', 'Anna', 'Brenda', 'Pamela', 'Nicole', 'Emma', 'Samantha',
    'Katherine', 'Christine', 'Debra', 'Rachel', 'Catherine', 'Carolyn', 'Janet', 'Ruth', 'Maria', 'Heather',
    'Diane', 'Virginia', 'Julie', 'Joyce', 'Victoria', 'Olivia', 'Kelly', 'Christina', 'Lauren', 'Joan',
    'Evelyn', 'Judith', 'Megan', 'Cheryl', 'Andrea', 'Hannah', 'Martha', 'Jacqueline', 'Frances', 'Gloria',
    'Ann', 'Teresa', 'Kathryn', 'Sara', 'Janice', 'Jean', 'Alice', 'Madison', 'Doris', 'Abigail', 'Julia',
    'Judy', 'Grace', 'Denise', 'Amber', 'Marilyn', 'Beverly', 'Danielle', 'Theresa', 'Sophia', 'Marie',
    'Diana', 'Brittany', 'Natalie', 'Isabella', 'Charlotte'
]);

const getGender = (name) => {
    const firstName = name ? name.split(' ')[0] : '';
    if (MALE_NAMES.has(firstName)) return 'men';
    if (FEMALE_NAMES.has(firstName)) return 'women';
    // Fallback: simple heuristic or random
    return Math.random() > 0.5 ? 'men' : 'women';
};

export const migrateUserData = async () => {
    console.log('🔄 Checking for user data migration...');
    try {
        const users = await getDocs(COLLECTIONS.USERS);
        let migratedCount = 0;

        for (const user of users) {
            let updates = {};
            let needsUpdate = false;

            // Migration 1: Split name into firstName and lastName
            if ((!user.firstName || !user.lastName) && (user.profile?.name || user.fullName || user.name)) {
                const fullName = user.profile?.name || user.fullName || user.name || '';
                const parts = fullName.split(' ');
                const firstName = parts[0];
                const lastName = parts.slice(1).join(' ');

                if (firstName) {
                    updates.firstName = firstName;
                    updates.lastName = lastName;
                    needsUpdate = true;
                }
            }

            // Migration 2: Add or update profile photo with gender-aware image
            const currentPhoto = user.photoURL || user.profile?.photoURL;
            const isGeneric = !currentPhoto || currentPhoto.includes('pravatar.cc') || currentPhoto.includes('via.placeholder');

            if (isGeneric) {
                // Use existing name or the one we just parsed
                const fullName = updates.firstName ? `${updates.firstName} ${updates.lastName}` : (user.profile?.name || user.fullName || user.name || '');
                const gender = getGender(fullName);

                // Generate a deterministic index 0-99 based on email hashing
                const emailSum = (user.email || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const portraitId = emailSum % 99;

                const photoURL = `https://randomuser.me/api/portraits/${gender}/${portraitId}.jpg`;

                updates.photoURL = photoURL;
                needsUpdate = true;
            }

            // Migration 3: Rename role 'customer' to 'homeowner'
            if (user.role === 'customer') {
                updates.role = 'homeowner';
                needsUpdate = true;
                console.log(`Converting user ${user.email} from customer to homeowner`);
            }

            // Consolidate updates
            if (needsUpdate) {
                // Ensure profile sub-object is updated correctly
                updates.profile = {
                    ...user.profile,
                    ...(updates.profile || {}),
                    firstName: updates.firstName || user.firstName || user.profile?.firstName,
                    lastName: updates.lastName || user.lastName || user.profile?.lastName,
                    photoURL: updates.photoURL || user.photoURL || user.profile?.photoURL,
                    name: user.profile?.name || user.fullName || user.name
                };

                await setDoc(COLLECTIONS.USERS, user.id, {
                    ...user,
                    ...updates
                });
                migratedCount++;
            }
        }

        if (migratedCount > 0) {
            console.log(`✅ Migrated ${migratedCount} users to new name structure and gender-aware photos.`);
        } else {
            console.log('✨ All users are up to date.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
};
