import {findEntryByName, setAutoEnabled} from '../lib/database.js';
import {unlock} from '../lib/unlock.js';

export async function autoCommand(
	filePath: string,
	name: string,
	enable: boolean,
): Promise<void> {
	const {db, key} = await unlock(filePath);

	const entry = findEntryByName(db, key, name);
	if (!entry) {
		db.close();
		throw new Error(`Entry "${name}" not found.`);
	}

	setAutoEnabled(db, entry.id, enable);
	db.close();
	console.error(
		`Auto mode ${enable ? 'enabled' : 'disabled'} for "${name}".`,
	);
}
