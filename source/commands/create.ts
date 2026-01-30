import {insertEntry, findEntryByName} from '../lib/database.js';
import {unlock} from '../lib/unlock.js';
import {readLine, readPassphrase} from '../lib/prompt.js';

export async function createCommand(
	filePath: string,
	name: string,
): Promise<void> {
	const {db, key} = await unlock(filePath);

	const existing = findEntryByName(db, key, name);
	if (existing) {
		db.close();
		throw new Error(`Entry "${name}" already exists.`);
	}

	const username = await readLine('Username: ');
	const password = await readPassphrase('Password: ');

	insertEntry(db, key, name, username, password);
	db.close();
	console.error(`Created entry "${name}".`);
}
