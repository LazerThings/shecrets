import {existsSync} from 'node:fs';
import {openDatabase, getMetadata} from '../lib/database.js';
import {deriveKey, verifyKey} from '../lib/crypto.js';
import {keychainSet} from '../lib/keychain.js';
import {readPassphrase} from '../lib/prompt.js';

export async function keychainCommand(filePath: string): Promise<void> {
	if (!existsSync(filePath)) {
		throw new Error(`File not found: ${filePath}`);
	}

	const db = openDatabase(filePath);
	const meta = getMetadata(db);
	db.close();

	if (!meta) {
		throw new Error('Invalid .she file: no metadata found.');
	}

	const passphrase = await readPassphrase('Passphrase: ');
	const key = await deriveKey(passphrase, meta.salt);
	if (!verifyKey(key, meta.verify, meta.verifyIv)) {
		throw new Error('Invalid passphrase.');
	}

	await keychainSet(meta.uuid, passphrase);
	console.error('Passphrase saved to keychain.');
}
