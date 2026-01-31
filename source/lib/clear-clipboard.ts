import clipboard from 'clipboardy';

let data = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk: string) => {
	data += chunk;
});
process.stdin.on('end', () => {
	const {expected, delay} = JSON.parse(data) as {
		expected: string;
		delay: number;
	};
	setTimeout(async () => {
		try {
			const current = await clipboard.read();
			if (current === expected) {
				await clipboard.write('');
			}
		} catch {}

		process.exit(0); // eslint-disable-line unicorn/no-process-exit
	}, delay);
});
