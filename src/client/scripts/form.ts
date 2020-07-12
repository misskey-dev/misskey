export type FormItem = {
	label?: string;
	type: 'string';
	default: string | null;
	hidden?: boolean;
	multiline?: boolean;
} | {
	label?: string;
	type: 'number';
	default: number | null;
	hidden?: boolean;
	step?: number;
} | {
	label?: string;
	type: 'boolean';
	default: boolean | null;
	hidden?: boolean;
} | {
	label?: string;
	type: 'enum';
	default: string | null;
	hidden?: boolean;
	enum: string[];
};

export type Form = Record<string, FormItem>;
