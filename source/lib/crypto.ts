import {randomBytes, createCipheriv, createDecipheriv} from 'node:crypto';
import argon2 from 'argon2';

const VERIFY_PLAINTEXT = 'shecrets-verify';
const AUTH_TAG_LENGTH = 16;

export async function deriveKey(
	passphrase: string,
	salt: Buffer,
): Promise<Buffer> {
	const hash = await argon2.hash(passphrase, {
		type: argon2.argon2id,
		salt,
		memoryCost: 65536,
		timeCost: 3,
		parallelism: 4,
		hashLength: 32,
		raw: true,
	});
	return Buffer.from(hash);
}

export function generateSalt(): Buffer {
	return randomBytes(32);
}

export function encrypt(
	key: Buffer,
	plaintext: string,
): {data: Buffer; iv: Buffer} {
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key, iv);
	const encrypted = Buffer.concat([
		cipher.update(plaintext, 'utf8'),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();
	return {data: Buffer.concat([encrypted, authTag]), iv};
}

export function decrypt(key: Buffer, data: Buffer, iv: Buffer): string {
	const encrypted = data.subarray(0, data.length - AUTH_TAG_LENGTH);
	const authTag = data.subarray(data.length - AUTH_TAG_LENGTH);
	const decipher = createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAuthTag(authTag);
	return Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	]).toString('utf8');
}

export function createVerification(key: Buffer): {data: Buffer; iv: Buffer} {
	return encrypt(key, VERIFY_PLAINTEXT);
}

export function verifyKey(key: Buffer, data: Buffer, iv: Buffer): boolean {
	try {
		return decrypt(key, data, iv) === VERIFY_PLAINTEXT;
	} catch {
		return false;
	}
}
