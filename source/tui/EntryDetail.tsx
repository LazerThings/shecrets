import React, {useState} from 'react';
import {Text, Box, useInput} from 'ink';
import type {DecryptedEntry} from '../lib/database.js';
import type {DbHandle} from '../lib/database.js';
import {
	removeEntry,
	setAutoEnabled,
	updateEntryField,
} from '../lib/database.js';
import {copyToClipboard} from '../lib/clipboard.js';

type Props = {
	entry: DecryptedEntry;
	db: DbHandle;
	cryptoKey: Buffer;
	onBack: () => void;
};

type EditState = {
	field: 'username' | 'password';
	value: string;
};

export default function EntryDetail({entry, db, cryptoKey, onBack}: Props) {
	const [showUsername, setShowUsername] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [status, setStatus] = useState('');
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [editing, setEditing] = useState<EditState | null>(null);
	const [editSubMenu, setEditSubMenu] = useState(false);

	useInput((input, key) => {
		if (editing) {
			if (key.return) {
				updateEntryField(
					db,
					cryptoKey,
					entry.id,
					editing.field,
					editing.value,
				);
				if (editing.field === 'username') {
					entry.username = editing.value;
				} else {
					entry.password = editing.value;
				}

				setEditing(null);
				setStatus(`${editing.field} updated`);
				return;
			}

			if (key.escape) {
				setEditing(null);
				return;
			}

			if (key.backspace || key.delete) {
				setEditing(prev =>
					prev ? {...prev, value: prev.value.slice(0, -1)} : null,
				);
				return;
			}

			if (input && !key.ctrl && !key.meta) {
				setEditing(prev =>
					prev ? {...prev, value: prev.value + input} : null,
				);
			}

			return;
		}

		if (confirmDelete) {
			if (input === 'y') {
				removeEntry(db, entry.id);
				setConfirmDelete(false);
				onBack();
				return;
			}

			setConfirmDelete(false);
			setStatus('delete cancelled');
			return;
		}

		if (editSubMenu) {
			if (input === 'u') {
				setEditSubMenu(false);
				setEditing({field: 'username', value: ''});
				return;
			}

			if (input === 'p') {
				setEditSubMenu(false);
				setEditing({field: 'password', value: ''});
				return;
			}

			if (key.escape) {
				setEditSubMenu(false);
			}

			return;
		}

		if (key.escape || key.backspace) {
			onBack();
			return;
		}

		if (input === 'u') {
			copyToClipboard(entry.username).then(() => {
				setStatus('username copied');
			});
			return;
		}

		if (input === 'p') {
			copyToClipboard(entry.password).then(() => {
				setStatus('password copied');
			});
			return;
		}

		if (input === 'U') {
			setShowUsername(prev => !prev);
			return;
		}

		if (input === 'P') {
			setShowPassword(prev => !prev);
			return;
		}

		if (input === 'e') {
			setEditSubMenu(true);
			return;
		}

		if (input === 'a') {
			const newVal = !entry.autoEnabled;
			setAutoEnabled(db, entry.id, newVal);
			entry.autoEnabled = newVal;
			setStatus(`auto ${newVal ? 'enabled' : 'disabled'}`);
			return;
		}

		if (input === 'd') {
			setConfirmDelete(true);
		}
	});

	if (editing) {
		const masked =
			editing.field === 'password'
				? '*'.repeat(editing.value.length)
				: editing.value;
		return (
			<Box flexDirection="column">
				<Text>
					New {editing.field}: {masked}
				</Text>
				<Text dimColor>enter to save · esc to cancel</Text>
			</Box>
		);
	}

	if (editSubMenu) {
		return (
			<Box flexDirection="column">
				<Text bold>Edit: u = username, p = password, esc = cancel</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="cyan">
					{entry.name}
				</Text>
				{entry.autoEnabled && <Text color="yellow"> [auto]</Text>}
			</Box>

			<Text>
				<Text bold>Username: </Text>
				{showUsername ? (
					<Text>{entry.username}</Text>
				) : (
					<Text dimColor>••••••••</Text>
				)}
			</Text>

			<Text>
				<Text bold>Password: </Text>
				{showPassword ? (
					<Text>{entry.password}</Text>
				) : (
					<Text dimColor>••••••••</Text>
				)}
			</Text>

			{confirmDelete && (
				<Box marginTop={1}>
					<Text color="red">Delete "{entry.name}"? y/N</Text>
				</Box>
			)}

			{status !== '' && (
				<Box marginTop={1}>
					<Text color="green">{status}</Text>
				</Box>
			)}

			<Box marginTop={1}>
				<Text dimColor>
					u/p copy · U/P reveal · e edit · a auto · d delete · esc
					back
				</Text>
			</Box>
		</Box>
	);
}
