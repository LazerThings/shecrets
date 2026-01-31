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
	  $ shecrets init <file.she>           Create a new encrypted secrets file
	  $ shecrets keychain <file.she>       Save passphrase to OS keychain
	  $ shecrets <file.she> [options]      Run a command on a secrets file
	  $ shecrets <file.she>                Open interactive TUI browser

	Options
	  -c <name>              Create entry
	  -l                     List entries
	  -r <name>              Remove entry
	  --eP <name>            Edit password
	  --eU <name>            Edit username
	  --uO <name>            Output username (stdout)
	  --pO <name>            Output password (stdout)
	  --uC <name>            Copy username to clipboard
	  --pC <name>            Copy password to clipboard
	  --enable-auto <name>   Enable auto mode
	  --disable-auto <name>  Disable auto mode

	Examples
	  $ shecrets init secrets.she
	  $ shecrets secrets.she -c "SSH Key"
	  $ shecrets secrets.she -l
	  $ shecrets secrets.she --pO "SSH Key"
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

	function requireName(flag: string | undefined, flagName: string): string | undefined {
		if (flag === undefined) return undefined;
		if (!flag || flag === 'true') {
			console.error(`Missing entry name for ${flagName}.`);
			process.exit(1);
		}

		return flag;
	}

	// -c "Name" — create
	const c = requireName(flags.c, '-c');
	if (c) {
		await createCommand(filePath, c);
		return;
	}

	// -l — list
	if (flags.l) {
		await listCommand(filePath);
		return;
	}

	// -r "Name" — remove
	const r = requireName(flags.r, '-r');
	if (r) {
		await removeCommand(filePath, r);
		return;
	}

	// --eP "Name" — edit password
	const eP = requireName(flags.eP, '--eP');
	if (eP) {
		await editCommand(filePath, eP, 'password');
		return;
	}

	// --eU "Name" — edit username
	const eU = requireName(flags.eU, '--eU');
	if (eU) {
		await editCommand(filePath, eU, 'username');
		return;
	}

	// Get operations
	const getModes: Array<{flag: string | undefined; flagName: string; mode: GetMode}> = [
		{flag: flags.uO, flagName: '--uO', mode: 'uO'},
		{flag: flags.pO, flagName: '--pO', mode: 'pO'},
		{flag: flags.uC, flagName: '--uC', mode: 'uC'},
		{flag: flags.pC, flagName: '--pC', mode: 'pC'},
	];

	for (const {flag, flagName, mode} of getModes) {
		const name = requireName(flag, flagName);
		if (name) {
			await getCommand(filePath, name, mode);
			return;
		}
	}

	// --enable-auto "Name"
	const enableAuto = requireName(flags.enableAuto, '--enable-auto');
	if (enableAuto) {
		await autoCommand(filePath, enableAuto, true);
		return;
	}

	// --disable-auto "Name"
	const disableAuto = requireName(flags.disableAuto, '--disable-auto');
	if (disableAuto) {
		await autoCommand(filePath, disableAuto, false);
		return;
	}

	// No flags — open TUI
	render(<TuiApp filePath={filePath} />);
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
