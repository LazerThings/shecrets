import {execSync} from 'node:child_process';

const SERVICE = 'shecrets';

export async function keychainGet(uuid: string): Promise<string | null> {
	try {
		switch (process.platform) {
			case 'darwin': {
				const result = execSync(
					`security find-generic-password -s ${SERVICE} -a ${uuid} -w`,
					{encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']},
				);
				return result.trim();
			}

			case 'linux': {
				const result = execSync(
					`secret-tool lookup service ${SERVICE} uuid ${uuid}`,
					{encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']},
				);
				return result.trim() || null;
			}

			case 'win32': {
				const script = `(Get-StoredCredential -Target '${SERVICE}:${uuid}').GetNetworkCredential().Password`;
				const result = execSync(
					`powershell -Command "${script}"`,
					{encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']},
				);
				return result.trim() || null;
			}

			default: {
				return null;
			}
		}
	} catch {
		return null;
	}
}

export async function keychainSet(
	uuid: string,
	passphrase: string,
): Promise<void> {
	switch (process.platform) {
		case 'darwin': {
			execSync(
				`security add-generic-password -s ${SERVICE} -a ${uuid} -w ${JSON.stringify(passphrase)} -U`,
				{stdio: ['pipe', 'pipe', 'pipe']},
			);
			break;
		}

		case 'linux': {
			execSync(
				`echo -n ${JSON.stringify(passphrase)} | secret-tool store --label ${SERVICE} service ${SERVICE} uuid ${uuid}`,
				{stdio: ['pipe', 'pipe', 'pipe']},
			);
			break;
		}

		case 'win32': {
			const script = `New-StoredCredential -Target '${SERVICE}:${uuid}' -UserName '${uuid}' -Password '${passphrase}' -Persist LocalMachine`;
			execSync(`powershell -Command "${script}"`, {
				stdio: ['pipe', 'pipe', 'pipe'],
			});
			break;
		}

		default: {
			throw new Error(`Unsupported platform: ${process.platform}`);
		}
	}
}

export async function keychainDelete(uuid: string): Promise<void> {
	try {
		switch (process.platform) {
			case 'darwin': {
				execSync(
					`security delete-generic-password -s ${SERVICE} -a ${uuid}`,
					{stdio: ['pipe', 'pipe', 'pipe']},
				);
				break;
			}

			case 'linux': {
				execSync(
					`secret-tool clear service ${SERVICE} uuid ${uuid}`,
					{stdio: ['pipe', 'pipe', 'pipe']},
				);
				break;
			}

			case 'win32': {
				execSync(
					`powershell -Command "Remove-StoredCredential -Target '${SERVICE}:${uuid}'"`,
					{stdio: ['pipe', 'pipe', 'pipe']},
				);
				break;
			}

			default: {
				break;
			}
		}
	} catch {
		// Ignore errors if credential doesn't exist
	}
}
