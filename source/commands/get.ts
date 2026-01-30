import {findEntryByName} from '../lib/database.js';
import {unlock} from '../lib/unlock.js';
import {confirm} from '../lib/prompt.js';
import {copyToClipboard} from '../lib/clipboard.js';

export type GetMode = 'uO' | 'pO' | 'uC' | 'pC';

export async function getCommand(
	filePath: string,
	name: string,
	mode: GetMode,
): Promise<void> {
	const {db, key} = await unlock(filePath);

	const entry = findEntryByName(db, key, name);
	if (!entry) {
		db.close();
		throw new Error(`Entry "${name}" not found.`);
	}

	db.close();

	const fieldLabel = mode.startsWith('u') ? 'username' : 'password';
	const value = mode.startsWith('u') ? entry.username : entry.password;

	if (!entry.autoEnabled) {
		const proceed = await confirm(
			`Are you sure you want to ${mode.endsWith('O') ? 'output' : 'copy'} the ${fieldLabel} for "${name}"?`,
		);
		if (!proceed) {
			return;
		}
	}

	if (mode.endsWith('O')) {
		process.stdout.write(value);
	} else {
		await copyToClipboard(value);
		console.error(`${fieldLabel} copied to clipboard.`);
	}
}
