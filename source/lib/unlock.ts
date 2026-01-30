import {existsSync} from 'node:fs';
import {openDatabase, getMetadata, type DbHandle} from './database.js';
import {deriveKey, verifyKey} from './crypto.js';
import {keychainGet, keychainSet} from './keychain.js';
import {readPassphrase, confirm} from './prompt.js';

export type UnlockResult = {
	db: DbHandle;
	key: Buffer;
	uuid: string;
};

export async function unlock(filePath: string): Promise<UnlockResult> {
	if (!existsSync(filePath)) {
		throw new Error(`File not found: ${filePath}`);
	}

	const db = openDatabase(filePath);
	const meta = getMetadata(db);
	if (!meta) {
		db.close();
		throw new Error('Invalid .she file: no metadata found.');
	}

	// Try keychain first
	let fromKeychain = false;
	let passphrase = await keychainGet(meta.uuid);
	if (passphrase) {
		const key = await deriveKey(passphrase, meta.salt);
		if (verifyKey(key, meta.verify, meta.verifyIv)) {
			return {db, key, uuid: meta.uuid};
		}

		// Keychain passphrase is stale/wrong, fall through to prompt
		passphrase = null;
	}

	// Prompt for passphrase
	passphrase = await readPassphrase('Passphrase: ');
	const key = await deriveKey(passphrase, meta.salt);
	if (!verifyKey(key, meta.verify, meta.verifyIv)) {
		db.close();
		throw new Error('Invalid passphrase.');
	}

	// Offer to save to keychain if not already stored
	if (!fromKeychain) {
		const save = await confirm('Save passphrase to keychain?');
		if (save) {
			await keychainSet(meta.uuid, passphrase);
		}
	}

	return {db, key, uuid: meta.uuid};
}
