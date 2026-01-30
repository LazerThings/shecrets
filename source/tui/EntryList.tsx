import React, {useState} from 'react';
import {Text, Box, useInput} from 'ink';
import type {DecryptedEntry} from '../lib/database.js';

type Props = {
	entries: DecryptedEntry[];
	onSelect: (entry: DecryptedEntry) => void;
	onCreate: () => void;
	onQuit: () => void;
};

export default function EntryList({
	entries,
	onSelect,
	onCreate,
	onQuit,
}: Props) {
	const [cursor, setCursor] = useState(0);

	useInput((input, key) => {
		if (input === 'q') {
			onQuit();
			return;
		}

		if (input === 'n') {
			onCreate();
			return;
		}

		if (key.return && entries.length > 0) {
			const entry = entries[cursor];
			if (entry) {
				onSelect(entry);
			}

			return;
		}

		if (key.upArrow) {
			setCursor(prev => Math.max(0, prev - 1));
			return;
		}

		if (key.downArrow) {
			setCursor(prev => Math.min(entries.length - 1, prev + 1));
		}
	});

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="cyan">
					shecrets
				</Text>
				<Text dimColor> — {entries.length} entries</Text>
			</Box>

			{entries.length === 0 ? (
				<Text dimColor>No entries. Press n to create one.</Text>
			) : (
				entries.map((entry, index) => (
					<Text key={entry.id}>
						{index === cursor ? (
							<Text color="green">{'> '}</Text>
						) : (
							<Text>{'  '}</Text>
						)}
						<Text bold={index === cursor}>{entry.name}</Text>
						{entry.autoEnabled && <Text dimColor> [auto]</Text>}
					</Text>
				))
			)}

			<Box marginTop={1}>
				<Text dimColor>
					↑↓ navigate · enter select · n new · q quit
				</Text>
			</Box>
		</Box>
	);
}
