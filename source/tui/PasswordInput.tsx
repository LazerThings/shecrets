import React, {useState} from 'react';
import {Text, useInput} from 'ink';

type Props = {
	prompt: string;
	onSubmit: (value: string) => void;
	mask?: string;
};

export default function PasswordInput({
	prompt,
	onSubmit,
	mask = '*',
}: Props) {
	const [value, setValue] = useState('');

	useInput((input, key) => {
		if (key.return) {
			onSubmit(value);
			return;
		}

		if (key.backspace || key.delete) {
			setValue(prev => prev.slice(0, -1));
			return;
		}

		if (input && !key.ctrl && !key.meta) {
			setValue(prev => prev + input);
		}
	});

	return (
		<Text>
			{prompt}
			{mask.repeat(value.length)}
		</Text>
	);
}
