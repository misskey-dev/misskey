export type AsUiText = {
	id: string;
	type: 'text';
	text: string;
	size?: number;
	bold?: boolean;
};

export type AsUiButton = {
	id: string;
	type: 'button';
	text: string;
	onClick: () => void;
	primary?: boolean;
	rounded?: boolean;
};

export type AsUiButtons = {
	id: string;
	type: 'buttons';
	buttons: AsUiButton[];
};

export type AsUiTextInput = {
	id: string;
	type: 'textInput';
	onInput: () => void;
};

export type AsUiContainer = {
	id: string;
	type: 'container';
	children: AsUiComponent[];
	align?: 'left' | 'center' | 'right';
};

export type AsUiComponent = AsUiText | AsUiButton | AsUiButtons | AsUiTextInput | AsUiContainer;
