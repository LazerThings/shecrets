import {listEntries} from '../lib/database.js';
import {unlock} from '../lib/unlock.js';

export async function listCommand(filePath: string): Promise<void> {
	const {db, key} = await unlock(filePath);
	const entries = listEntries(db, key);
	db.close();

	if (entries.length === 0) {
		console.error('No entries.');
		return;
	}

	for (const entry of entries) {
		const auto = entry.autoEnabled ? ' [auto]' : '';
		console.log(`${entry.name}${auto}`);
	}
}
