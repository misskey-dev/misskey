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
	children: Block[];
};

export type ImageBlock = BlockBase & {
	type: 'image';
	fileId: string | null;
};

export type NoteBlock = BlockBase & {
	type: 'note';
	detailed: boolean;
	note: string | null;
};

export type Block =
	TextBlock | SectionBlock | ImageBlock | NoteBlock;
