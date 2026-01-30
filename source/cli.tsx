#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import {initCommand} from './commands/init.js';
import {keychainCommand} from './commands/keychain.js';
import {createCommand} from './commands/create.js';
import {listCommand} from './commands/list.js';
import {getCommand, type GetMode} from './commands/get.js';
import {removeCommand} from './commands/remove.js';
import {editCommand} from './commands/edit.js';
import {autoCommand} from './commands/auto.js';
import TuiApp from './tui/App.js';

const cli = meow(
	`
	Usage
	  $ shecrets init <file.she>
	  $ shecrets keychain <file.she>
	  $ shecrets <file.she> [options]
	  $ shecrets <file.she>                (opens TUI browser)

	Options
	  -c <name>              Create entry
	  -l                     List entries
	  -r <name>              Remove entry
	  -eP <name>             Edit password
	  -eU <name>             Edit username
	  -uO <name>             Output username (stdout)
	  -pO <name>             Output password (stdout)
	  -uC <name>             Copy username to clipboard
	  -pC <name>             Copy password to clipboard
	  --enable-auto <name>   Enable auto mode
	  --disable-auto <name>  Disable auto mode

	Examples
	  $ shecrets init secrets.she
	  $ shecrets secrets.she -c "SSH Key"
	  $ shecrets secrets.she -l
	  $ shecrets secrets.she -pO "SSH Key"
	  $ shecrets secrets.she
`,
	{
		importMeta: import.meta,
		flags: {
			c: {type: 'string'},
			l: {type: 'boolean', default: false},
			r: {type: 'string'},
			eP: {type: 'string'},
			eU: {type: 'string'},
			uO: {type: 'string'},
			pO: {type: 'string'},
			uC: {type: 'string'},
			pC: {type: 'string'},
			enableAuto: {type: 'string'},
			disableAuto: {type: 'string'},
		},
	},
);

async function main() {
	const [command, ...rest] = cli.input;

	// Route: shecrets init <file>
	if (command === 'init') {
		const filePath = rest[0];
		if (!filePath) {
			console.error('Usage: shecrets init <file.she>');
			process.exit(1);
		}

		await initCommand(filePath);
		return;
	}

	// Route: shecrets keychain <file>
	if (command === 'keychain') {
		const filePath = rest[0];
		if (!filePath) {
			console.error('Usage: shecrets keychain <file.she>');
			process.exit(1);
		}

		await keychainCommand(filePath);
		return;
	}

	// All other commands need a .she file as first arg
	const filePath = command;
	if (!filePath) {
		cli.showHelp();
		return;
	}

	const {flags} = cli;

	// -c "Name" — create
	if (flags.c !== undefined) {
		await createCommand(filePath, flags.c);
		return;
	}

	// -l — list
	if (flags.l) {
		await listCommand(filePath);
		return;
	}

	// -r "Name" — remove
	if (flags.r !== undefined) {
		await removeCommand(filePath, flags.r);
		return;
	}

	// -eP "Name" — edit password
	if (flags.eP !== undefined) {
		await editCommand(filePath, flags.eP, 'password');
		return;
	}

	// -eU "Name" — edit username
	if (flags.eU !== undefined) {
		await editCommand(filePath, flags.eU, 'username');
		return;
	}

	// Get operations
	const getModes: Array<{flag: string | undefined; mode: GetMode}> = [
		{flag: flags.uO, mode: 'uO'},
		{flag: flags.pO, mode: 'pO'},
		{flag: flags.uC, mode: 'uC'},
		{flag: flags.pC, mode: 'pC'},
	];

	for (const {flag, mode} of getModes) {
		if (flag !== undefined) {
			await getCommand(filePath, flag, mode);
			return;
		}
	}

	// --enable-auto "Name"
	if (flags.enableAuto !== undefined) {
		await autoCommand(filePath, flags.enableAuto, true);
		return;
	}

	// --disable-auto "Name"
	if (flags.disableAuto !== undefined) {
		await autoCommand(filePath, flags.disableAuto, false);
		return;
	}

	// No flags — open TUI
	render(<TuiApp filePath={filePath} />);
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
