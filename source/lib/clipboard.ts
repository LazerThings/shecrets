import clipboard from 'clipboardy';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const CLEAR_DELAY_SECONDS = 45;

export async function copyToClipboard(text: string): Promise<void> {
	await clipboard.write(text);
	scheduleClipboardClear(text);
}

function scheduleClipboardClear(expected: string): void {
	const thisDir = dirname(fileURLToPath(import.meta.url));
	const clearScript = resolve(thisDir, 'clear-clipboard.js');

	const child = spawn(process.execPath, [clearScript], {
		detached: true,
		stdio: ['pipe', 'ignore', 'ignore'],
	});

	child.stdin!.write(
		JSON.stringify({expected, delay: CLEAR_DELAY_SECONDS * 1000}),
	);
	child.stdin!.end();
	child.unref();
}
