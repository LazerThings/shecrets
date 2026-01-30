import {findEntryByName, removeEntry} from '../lib/database.js';
import {unlock} from '../lib/unlock.js';
import {confirm} from '../lib/prompt.js';

export async function removeCommand(
	filePath: string,
	name: string,
): Promise<void> {
	const {db, key} = await unlock(filePath);

	const entry = findEntryByName(db, key, name);
	if (!entry) {
		db.close();
		throw new Error(`Entry "${name}" not found.`);
	}

	if (!entry.autoEnabled) {
		const proceed = await confirm(
			`Are you sure you want to remove "${name}"?`,
		);
		if (!proceed) {
			db.close();
			return;
		}
	}

	removeEntry(db, entry.id);
	db.close();
	console.error(`Removed entry "${name}".`);
}
