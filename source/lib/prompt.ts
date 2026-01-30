import {createInterface} from 'node:readline';

export async function readPassphrase(prompt: string): Promise<string> {
	return new Promise(resolve => {
		const rl = createInterface({
			input: process.stdin,
			output: process.stderr,
			terminal: true,
		});

		// Mute output for passphrase entry
		const originalWrite = process.stderr.write.bind(process.stderr);
		let muted = false;

		process.stderr.write = ((
			chunk: string | Uint8Array,
			encodingOrCb?: BufferEncoding | ((err?: Error | null) => void),
			cb?: (err?: Error | null) => void,
		): boolean => {
			if (muted) {
				if (typeof chunk === 'string' && chunk === prompt) {
					return originalWrite(chunk);
				}

				return true;
			}

			return originalWrite(chunk, encodingOrCb as BufferEncoding, cb);
		}) as typeof process.stderr.write;

		rl.question(prompt, answer => {
			muted = false;
			process.stderr.write = originalWrite;
			process.stderr.write('\n');
			rl.close();
			resolve(answer);
		});

		muted = true;
	});
}

export async function readPassphraseWithConfirm(
	prompt: string,
): Promise<string> {
	const pass1 = await readPassphrase(prompt);
	const pass2 = await readPassphrase('Confirm passphrase: ');
	if (pass1 !== pass2) {
		throw new Error('Passphrases do not match.');
	}

	return pass1;
}

export async function confirm(message: string): Promise<boolean> {
	return new Promise(resolve => {
		const rl = createInterface({
			input: process.stdin,
			output: process.stderr,
			terminal: true,
		});

		rl.question(`${message} [y/N] `, answer => {
			rl.close();
			resolve(answer.toLowerCase() === 'y');
		});
	});
}

export async function readLine(prompt: string): Promise<string> {
	return new Promise(resolve => {
		const rl = createInterface({
			input: process.stdin,
			output: process.stderr,
			terminal: true,
		});

		rl.question(prompt, answer => {
			rl.close();
			resolve(answer);
		});
	});
}
