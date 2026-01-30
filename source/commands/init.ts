import {existsSync} from 'node:fs';
import {v4 as uuidv4} from 'uuid';
import {openDatabase, initSchema, insertMetadata} from '../lib/database.js';
import {deriveKey, generateSalt, createVerification} from '../lib/crypto.js';
import {readPassphraseWithConfirm, confirm} from '../lib/prompt.js';
import {keychainSet} from '../lib/keychain.js';

export async function initCommand(filePath: string): Promise<void> {
	if (existsSync(filePath)) {
		throw new Error(`File already exists: ${filePath}`);
	}

	if (!filePath.endsWith('.she')) {
		throw new Error('File must have a .she extension.');
	}

	const passphrase = await readPassphraseWithConfirm('New passphrase: ');
	const salt = generateSalt();
	const key = await deriveKey(passphrase, salt);
	const verification = createVerification(key);
	const uuid = uuidv4();

	const db = openDatabase(filePath);
	initSchema(db);
	insertMetadata(db, {
		uuid,
		salt,
		verify: verification.data,
		verifyIv: verification.iv,
	});
	db.close();

	console.error(`Created ${filePath}`);

	const save = await confirm('Save passphrase to keychain?');
	if (save) {
		await keychainSet(uuid, passphrase);
		console.error('Passphrase saved to keychain.');
	}
}
