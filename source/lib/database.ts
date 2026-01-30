import Database from 'better-sqlite3';
import {encrypt, decrypt} from './crypto.js';

export type DbHandle = InstanceType<typeof Database>;

export type Metadata = {
	uuid: string;
	salt: Buffer;
	verify: Buffer;
	verifyIv: Buffer;
};

export type EntryRow = {
	id: number;
	name: Buffer;
	name_iv: Buffer;
	username: Buffer;
	username_iv: Buffer;
	password: Buffer;
	password_iv: Buffer;
	auto_enabled: number;
};

export type DecryptedEntry = {
	id: number;
	name: string;
	username: string;
	password: string;
	autoEnabled: boolean;
};

export function openDatabase(filePath: string): DbHandle {
	return new Database(filePath);
}

export function initSchema(db: DbHandle): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS metadata (
			uuid       TEXT NOT NULL,
			salt       BLOB NOT NULL,
			verify     BLOB NOT NULL,
			verify_iv  BLOB NOT NULL
		);

		CREATE TABLE IF NOT EXISTS entries (
			id            INTEGER PRIMARY KEY AUTOINCREMENT,
			name          BLOB NOT NULL,
			name_iv       BLOB NOT NULL,
			username      BLOB NOT NULL,
			username_iv   BLOB NOT NULL,
			password      BLOB NOT NULL,
			password_iv   BLOB NOT NULL,
			auto_enabled  INTEGER DEFAULT 0
		);
	`);
}

export function insertMetadata(
	db: DbHandle,
	meta: Metadata,
): void {
	db.prepare(
		'INSERT INTO metadata (uuid, salt, verify, verify_iv) VALUES (?, ?, ?, ?)',
	).run(meta.uuid, meta.salt, meta.verify, meta.verifyIv);
}

export function getMetadata(db: DbHandle): Metadata | undefined {
	const row = db.prepare('SELECT uuid, salt, verify, verify_iv FROM metadata').get() as
		| {uuid: string; salt: Buffer; verify: Buffer; verify_iv: Buffer}
		| undefined;
	if (!row) return undefined;
	return {
		uuid: row.uuid,
		salt: row.salt,
		verify: row.verify,
		verifyIv: row.verify_iv,
	};
}

export function insertEntry(
	db: DbHandle,
	key: Buffer,
	name: string,
	username: string,
	password: string,
): void {
	const encName = encrypt(key, name);
	const encUser = encrypt(key, username);
	const encPass = encrypt(key, password);
	db.prepare(
		`INSERT INTO entries (name, name_iv, username, username_iv, password, password_iv)
		 VALUES (?, ?, ?, ?, ?, ?)`,
	).run(
		encName.data,
		encName.iv,
		encUser.data,
		encUser.iv,
		encPass.data,
		encPass.iv,
	);
}

export function listEntries(db: DbHandle, key: Buffer): DecryptedEntry[] {
	const rows = db.prepare('SELECT * FROM entries ORDER BY id').all() as EntryRow[];
	return rows.map(row => ({
		id: row.id,
		name: decrypt(key, row.name, row.name_iv),
		username: decrypt(key, row.username, row.username_iv),
		password: decrypt(key, row.password, row.password_iv),
		autoEnabled: row.auto_enabled === 1,
	}));
}

export function findEntryByName(
	db: DbHandle,
	key: Buffer,
	name: string,
): DecryptedEntry | undefined {
	return listEntries(db, key).find(e => e.name === name);
}

export function removeEntry(db: DbHandle, id: number): void {
	db.prepare('DELETE FROM entries WHERE id = ?').run(id);
}

export function updateEntryField(
	db: DbHandle,
	key: Buffer,
	id: number,
	field: 'username' | 'password',
	value: string,
): void {
	const enc = encrypt(key, value);
	db.prepare(
		`UPDATE entries SET ${field} = ?, ${field}_iv = ? WHERE id = ?`,
	).run(enc.data, enc.iv, id);
}

export function setAutoEnabled(
	db: DbHandle,
	id: number,
	enabled: boolean,
): void {
	db.prepare('UPDATE entries SET auto_enabled = ? WHERE id = ?').run(
		enabled ? 1 : 0,
		id,
	);
}
