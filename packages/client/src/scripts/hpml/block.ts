// blocks

export type TextBlock = {
	type: 'text';
	id: string;
	text: string;
};

export type SectionBlock = {
	type: 'section';
	id: string;
	title: string;
	children: (Block | VarBlock)[];
};

export type ImageBlock = {
	type: 'image';
	id: string;
	fileId: string | null;
};

export type ButtonBlock = {
	type: 'button';
	id: string;
	text: any;
	primary: boolean;
	action: string;
	content: string;
	event: string;
	message: string;
	var: string;
	fn: string;
};

export type IfBlock = {
	type: 'if';
	id: string;
	var: string;
	children: Block[];
};

export type TextareaBlock = {
	type: 'textarea';
	id: string;
	text: string;
};

export type PostBlock = {
	type: 'post';
	id: string;
	text: string;
	attachCanvasImage: boolean;
	canvasId: string;
};

export type CanvasBlock = {
	type: 'canvas';
	id: string;
	name: string; // canvas id
	width: number;
	height: number;
};

export type NoteBlock = {
	type: 'note';
	id: string;
	detailed: boolean;
	note: string | null;
};

export type Block =
	TextBlock | SectionBlock | ImageBlock | ButtonBlock | IfBlock | TextareaBlock | PostBlock | CanvasBlock | NoteBlock | VarBlock;

// variable blocks

export type NumberInputVarBlock = {
	type: 'numberInput';
	id: string;
	name: string;
	text: string;
};

export type TextInputVarBlock = {
	type: 'textInput';
	id: string;
	name: string;
	text: string;
};

export type SwitchVarBlock = {
	type: 'switch';
	id: string;
	name: string;
	text: string;
};

export type RadioButtonVarBlock = {
	type: 'radioButton';
	id: string;
	name: string;
	title: string;
	values: string[];
};

export type CounterVarBlock = {
	type: 'counter';
	id: string;
	name: string;
	text: string;
	inc: number;
};

export type VarBlock =
	NumberInputVarBlock | TextInputVarBlock | SwitchVarBlock | RadioButtonVarBlock | CounterVarBlock;

const varBlock = ['numberInput', 'textInput', 'switch', 'radioButton', 'counter'];
export function isVarBlock(block: Block): block is VarBlock {
	return varBlock.includes(block.type);
}
