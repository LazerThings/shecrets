import React, {useState} from 'react';
import {Text, Box, useInput} from 'ink';

type Props = {
	onSubmit: (name: string, username: string, password: string) => void;
	onCancel: () => void;
};

type Step = 'name' | 'username' | 'password' | 'confirm';

export default function CreateEntry({onSubmit, onCancel}: Props) {
	const [step, setStep] = useState<Step>('name');
	const [name, setName] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPass, setConfirmPass] = useState('');

	const currentValue = (): string => {
		switch (step) {
			case 'name': {
				return name;
			}

			case 'username': {
				return username;
			}

			case 'password': {
				return password;
			}

			case 'confirm': {
				return confirmPass;
			}
		}
	};

	const setCurrentValue = (v: string): void => {
		switch (step) {
			case 'name': {
				setName(v);
				break;
			}

			case 'username': {
				setUsername(v);
				break;
			}

			case 'password': {
				setPassword(v);
				break;
			}

			case 'confirm': {
				setConfirmPass(v);
				break;
			}
		}
	};

	useInput((input, key) => {
		if (key.escape) {
			onCancel();
			return;
		}

		if (key.return) {
			switch (step) {
				case 'name': {
					if (name.length > 0) {
						setStep('username');
					}

					break;
				}

				case 'username': {
					setStep('password');
					break;
				}

				case 'password': {
					if (password.length > 0) {
						setStep('confirm');
					}

					break;
				}

				case 'confirm': {
					if (confirmPass === password) {
						onSubmit(name, username, password);
					} else {
						setConfirmPass('');
						setPassword('');
						setStep('password');
					}

					break;
				}
			}

			return;
		}

		if (key.backspace || key.delete) {
			setCurrentValue(currentValue().slice(0, -1));
			return;
		}

		if (input && !key.ctrl && !key.meta) {
			setCurrentValue(currentValue() + input);
		}
	});

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="cyan">
					New Entry
				</Text>
			</Box>

			<Text>
				<Text bold>Name: </Text>
				{step === 'name' ? (
					<Text>{name}</Text>
				) : (
					<Text dimColor>{name}</Text>
				)}
			</Text>

			{(step === 'username' ||
				step === 'password' ||
				step === 'confirm') && (
				<Text>
					<Text bold>Username: </Text>
					{step === 'username' ? (
						<Text>{username}</Text>
					) : (
						<Text dimColor>{username}</Text>
					)}
				</Text>
			)}

			{(step === 'password' || step === 'confirm') && (
				<Text>
					<Text bold>Password: </Text>
					<Text>{'*'.repeat(password.length)}</Text>
				</Text>
			)}

			{step === 'confirm' && (
				<Text>
					<Text bold>Confirm: </Text>
					<Text>{'*'.repeat(confirmPass.length)}</Text>
				</Text>
			)}

			{step === 'confirm' && confirmPass.length > 0 && confirmPass !== password.slice(0, confirmPass.length) && (
				<Text color="red">Passwords do not match</Text>
			)}

			<Box marginTop={1}>
				<Text dimColor>
					{step === 'name' && 'Enter entry name · esc cancel'}
					{step === 'username' && 'Enter username · esc cancel'}
					{step === 'password' && 'Enter password · esc cancel'}
					{step === 'confirm' && 'Confirm password · esc cancel'}
				</Text>
			</Box>
		</Box>
	);
}
