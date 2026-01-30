import {findEntryByName, updateEntryField} from '../lib/database.js';
import {unlock} from '../lib/unlock.js';
import {readLine, readPassphrase, confirm} from '../lib/prompt.js';

export async function editCommand(
	filePath: string,
	name: string,
	field: 'username' | 'password',
): Promise<void> {
	const {db, key} = await unlock(filePath);

	const entry = findEntryByName(db, key, name);
	if (!entry) {
		db.close();
		throw new Error(`Entry "${name}" not found.`);
	}

	if (!entry.autoEnabled) {
		const proceed = await confirm(
			`Are you sure you want to edit the ${field} for "${name}"?`,
		);
		if (!proceed) {
			db.close();
			return;
		}
	}

	let newValue: string;
	if (field === 'password') {
		newValue = await readPassphrase('New password: ');
	} else {
		newValue = await readLine('New username: ');
	}

	updateEntryField(db, key, entry.id, field, newValue);
	db.close();
	console.error(`Updated ${field} for "${name}".`);
}
