import React, {useState, useEffect} from 'react';
import {Text, useApp, useInput} from 'ink';
import {
	openDatabase,
	getMetadata,
	listEntries,
	insertEntry,
	type DbHandle,
	type DecryptedEntry,
} from '../lib/database.js';
import {deriveKey, verifyKey} from '../lib/crypto.js';
import {keychainGet, keychainSet} from '../lib/keychain.js';
import EntryList from './EntryList.js';
import EntryDetail from './EntryDetail.js';
import CreateEntry from './CreateEntry.js';
import PasswordInput from './PasswordInput.js';

type Props = {
	filePath: string;
};

type View =
	| {type: 'loading'}
	| {type: 'passphrase'}
	| {type: 'error'; message: string}
	| {type: 'list'}
	| {type: 'detail'; entry: DecryptedEntry}
	| {type: 'create'}
	| {type: 'keychainPrompt'; passphrase: string};

export default function App({filePath}: Props) {
	const {exit} = useApp();
	const [view, setView] = useState<View>({type: 'loading'});
	const [db, setDb] = useState<DbHandle | null>(null);
	const [cryptoKey, setCryptoKey] = useState<Buffer | null>(null);
	const [entries, setEntries] = useState<DecryptedEntry[]>([]);
	const [uuid, setUuid] = useState('');

	const refreshEntries = (database: DbHandle, key: Buffer) => {
		setEntries(listEntries(database, key));
	};

	useEffect(() => {
		(async () => {
			try {
				const database = openDatabase(filePath);
				const meta = getMetadata(database);
				if (!meta) {
					setView({
						type: 'error',
						message: 'Invalid .she file: no metadata found.',
					});
					return;
				}

				setDb(database);
				setUuid(meta.uuid);

				// Try keychain
				const stored = await keychainGet(meta.uuid);
				if (stored) {
					const key = await deriveKey(stored, meta.salt);
					if (verifyKey(key, meta.verify, meta.verifyIv)) {
						setCryptoKey(key);
						refreshEntries(database, key);
						setView({type: 'list'});
						return;
					}
				}

				setView({type: 'passphrase'});
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : String(error);
				setView({type: 'error', message});
			}
		})();
	}, []);

	const handlePassphrase = async (passphrase: string) => {
		if (!db) return;
		const meta = getMetadata(db);
		if (!meta) return;

		const key = await deriveKey(passphrase, meta.salt);
		if (!verifyKey(key, meta.verify, meta.verifyIv)) {
			setView({type: 'error', message: 'Invalid passphrase.'});
			return;
		}

		setCryptoKey(key);
		refreshEntries(db, key);

		// Check if we should offer keychain save
		const stored = await keychainGet(uuid);
		if (!stored) {
			setView({type: 'keychainPrompt', passphrase});
		} else {
			setView({type: 'list'});
		}
	};

	const handleKeychainResponse = async (
		save: boolean,
		passphrase: string,
	) => {
		if (save) {
			await keychainSet(uuid, passphrase);
		}

		setView({type: 'list'});
	};

	const handleCreate = (name: string, username: string, password: string) => {
		if (!db || !cryptoKey) return;
		insertEntry(db, cryptoKey, name, username, password);
		refreshEntries(db, cryptoKey);
		setView({type: 'list'});
	};

	const handleBack = () => {
		if (!db || !cryptoKey) return;
		refreshEntries(db, cryptoKey);
		setView({type: 'list'});
	};

	const handleQuit = () => {
		if (db) {
			db.close();
		}

		exit();
	};

	switch (view.type) {
		case 'loading': {
			return <Text dimColor>Loading...</Text>;
		}

		case 'passphrase': {
			return (
				<PasswordInput
					prompt="Passphrase: "
					onSubmit={handlePassphrase}
				/>
			);
		}

		case 'keychainPrompt': {
			return (
				<KeychainPrompt
					onRespond={async (save: boolean) =>
						handleKeychainResponse(save, view.passphrase)
					}
				/>
			);
		}

		case 'error': {
			return <Text color="red">{view.message}</Text>;
		}

		case 'list': {
			return (
				<EntryList
					entries={entries}
					onSelect={entry => setView({type: 'detail', entry})}
					onCreate={() => setView({type: 'create'})}
					onQuit={handleQuit}
				/>
			);
		}

		case 'detail': {
			if (!db || !cryptoKey) return null;
			return (
				<EntryDetail
					entry={view.entry}
					db={db}
					cryptoKey={cryptoKey}
					onBack={handleBack}
				/>
			);
		}

		case 'create': {
			return (
				<CreateEntry
					onSubmit={handleCreate}
					onCancel={() => setView({type: 'list'})}
				/>
			);
		}

		default: {
			return null;
		}
	}
}

function KeychainPrompt({onRespond}: {onRespond: (save: boolean) => void}) {
	const [answered, setAnswered] = useState(false);

	useInput((input: string) => {
		if (answered) return;
		if (input === 'y' || input === 'Y') {
			setAnswered(true);
			onRespond(true);
		} else if (input === 'n' || input === 'N' || input === '\r') {
			setAnswered(true);
			onRespond(false);
		}
	});

	return <Text>Save passphrase to keychain? [y/N] </Text>;
}
