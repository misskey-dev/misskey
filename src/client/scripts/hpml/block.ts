// blocks

export type BlockBase = {
	id: string;
	type: string;
};

export type TextBlock = BlockBase & {
	type: 'text';
	text: string;
};

export type SectionBlock = BlockBase & {
	type: 'section';
	title: string;
	children: (Block | VarBlock)[];
};

export type ImageBlock = BlockBase & {
	type: 'image';
	fileId: string | null;
};

export type ButtonBlock = BlockBase & {
	type: 'button';
	text: any;
	primary: boolean;
	action: string;
	content: string;
	event: string;
	message: string;
	var: string;
	fn: string;
};

export type IfBlock = BlockBase & {
	type: 'if';
	var: string;
	children: Block[];
};

export type TextareaBlock = BlockBase & {
	type: 'textarea';
	text: string;
};

export type PostBlock = BlockBase & {
	type: 'post';
	text: string;
	attachCanvasImage: boolean;
	canvasId: string;
};

export type CanvasBlock = BlockBase & {
	type: 'canvas';
	name: string; // canvas id
	width: number;
	height: number;
};

export type NoteBlock = BlockBase & {
	type: 'note';
	detailed: boolean;
	note: string | null;
};

export type Block =
	TextBlock | SectionBlock | ImageBlock | ButtonBlock | IfBlock | TextareaBlock | PostBlock | CanvasBlock | NoteBlock | VarBlock;

// variable blocks

export type VarBlockBase = BlockBase & {
	name: string;
};

export type NumberInputVarBlock = VarBlockBase & {
	type: 'numberInput';
	text: string;
};

export type TextInputVarBlock = VarBlockBase & {
	type: 'textInput';
	text: string;
};

export type SwitchVarBlock = VarBlockBase & {
	type: 'switch';
	text: string;
};

export type RadioButtonVarBlock = VarBlockBase & {
	type: 'radioButton';
	title: string;
	values: string[];
};

export type CounterVarBlock = VarBlockBase & {
	type: 'counter';
	text: string;
	inc: number;
};

export type VarBlock =
	NumberInputVarBlock | TextInputVarBlock | SwitchVarBlock | RadioButtonVarBlock | CounterVarBlock;

const varBlock = ['numberInput', 'textInput', 'switch', 'radioButton', 'counter'];
export function isVarBlock(block: Block): block is VarBlock {
	return varBlock.includes(block.type);
}
