import { Interpreter, Parser, utils, values } from '@syuilo/aiscript';

export type AsUiText = {
	id: string;
	type: 'text';
	text: string;
	size?: number;
	bold?: boolean;
	color?: string;
	font?: 'serif' | 'sans-serif' | 'monospace';
};

export type AsUiMfm = {
	id: string;
	type: 'mfm';
	text: string;
	size?: number;
	color?: string;
	font?: 'serif' | 'sans-serif' | 'monospace';
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

export type AsUiSwitch = {
	id: string;
	type: 'switch';
	onChange: () => void;
	default?: boolean;
	label?: string;
	caption?: string;
};

export type AsUiTextInput = {
	id: string;
	type: 'textInput';
	onInput: () => void;
	default?: string;
	label?: string;
	caption?: string;
};

export type AsUiNumberInput = {
	id: string;
	type: 'numberInput';
	onInput: () => void;
	default?: number;
	label?: string;
	caption?: string;
};

export type AsUiContainer = {
	id: string;
	type: 'container';
	children: AsUiComponent[];
	align?: 'left' | 'center' | 'right';
	bgColor?: string;
	fgColor?: string;
	font?: 'serif' | 'sans-serif' | 'monospace';
	borderWidth?: number;
	borderColor?: string;
	padding?: number;
	rounded?: boolean;
};

export type AsUiComponent = AsUiText | AsUiMfm | AsUiButton | AsUiButtons | AsUiSwitch | AsUiTextInput | AsUiNumberInput | AsUiContainer;

export function render(defs: values.Value[], call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>) {
	const res = [] as AsUiComponent[];

	for (const def of defs) {
		utils.assertObject(def);
		const type = def.value.get('type');
		utils.assertString(type);

		switch (type.value) {
			case 'text': {
				const id = def.value.get('id');
				utils.assertString(id);
				const text = def.value.get('text');
				utils.assertString(text);
				const size = def.value.get('size');
				if (size) utils.assertNumber(size);
				const bold = def.value.get('bold');
				if (bold) utils.assertBoolean(bold);
				const color = def.value.get('color');
				if (color) utils.assertString(color);
				const font = def.value.get('font');
				if (font) utils.assertString(font);

				res.push({
					id: id.value,
					type: 'text',
					text: text.value,
					size: size?.value,
					bold: bold?.value,
					color: color?.value,
					font: font?.value,
				});
				break;
			}

			case 'mfm': {
				const id = def.value.get('id');
				utils.assertString(id);
				const text = def.value.get('text');
				utils.assertString(text);
				const size = def.value.get('size');
				if (size) utils.assertNumber(size);
				const color = def.value.get('color');
				if (color) utils.assertString(color);
				const font = def.value.get('font');
				if (font) utils.assertString(font);

				res.push({
					id: id.value,
					type: 'text',
					text: text.value,
					size: size?.value,
					color: color?.value,
					font: font?.value,
				});
				break;
			}
		
			case 'switch': {
				const id = def.value.get('id');
				utils.assertString(id);
				const onChange = def.value.get('onChange');
				utils.assertFunction(onChange);
				const defaultValue = def.value.get('default');
				if (defaultValue) utils.assertBoolean(defaultValue);
				const label = def.value.get('label');
				if (label) utils.assertString(label);
				const caption = def.value.get('caption');
				if (caption) utils.assertString(caption);

				res.push({
					id: id.value,
					type: 'switch',
					onChange: (v) => {
						call(onChange, [utils.jsToVal(v)]);
					},
					default: defaultValue?.value,
					label: label?.value,
					caption: caption?.value,
				});
				break;
			}

			case 'textInput': {
				const id = def.value.get('id');
				utils.assertString(id);
				const onInput = def.value.get('onInput');
				utils.assertFunction(onInput);
				const defaultValue = def.value.get('default');
				if (defaultValue) utils.assertString(defaultValue);
				const label = def.value.get('label');
				if (label) utils.assertString(label);
				const caption = def.value.get('caption');
				if (caption) utils.assertString(caption);

				res.push({
					id: id.value,
					type: 'textInput',
					onInput: (v) => {
						call(onInput, [utils.jsToVal(v)]);
					},
					default: defaultValue?.value,
					label: label?.value,
					caption: caption?.value,
				});
				break;
			}

			case 'numberInput': {
				const id = def.value.get('id');
				utils.assertString(id);
				const onInput = def.value.get('onInput');
				utils.assertFunction(onInput);
				const defaultValue = def.value.get('default');
				if (defaultValue) utils.assertString(defaultValue);
				const label = def.value.get('label');
				if (label) utils.assertString(label);
				const caption = def.value.get('caption');
				if (caption) utils.assertString(caption);

				res.push({
					id: id.value,
					type: 'numberInput',
					onInput: (v) => {
						call(onInput, [utils.jsToVal(v)]);
					},
					default: defaultValue?.value,
					label: label?.value,
					caption: caption?.value,
				});
				break;
			}

			case 'button': {
				const id = def.value.get('id');
				utils.assertString(id);
				const text = def.value.get('text');
				utils.assertString(text);
				const onClick = def.value.get('onClick');
				utils.assertFunction(onClick);
				const primary = def.value.get('primary');
				if (primary) utils.assertBoolean(primary);
				const rounded = def.value.get('rounded');
				if (rounded) utils.assertBoolean(rounded);

				res.push({
					id: id.value,
					type: 'button',
					text: text.value,
					onClick: () => {
						call(onClick, []);
					},
					primary: primary?.value,
					rounded: rounded?.value,
				});
				break;
			}

			case 'buttons': {
				const id = def.value.get('id');
				utils.assertString(id);
				const buttons = def.value.get('buttons');
				utils.assertArray(buttons);

				res.push({
					id: id.value,
					type: 'buttons',
					buttons: buttons.value.map(button => {
						utils.assertObject(button);
						const text = button.value.get('text');
						utils.assertString(text);
						const onClick = button.value.get('onClick');
						utils.assertFunction(onClick);
						const primary = button.value.get('primary');
						if (primary) utils.assertBoolean(primary);
						const rounded = button.value.get('rounded');
						if (rounded) utils.assertBoolean(rounded);

						return {
							text: text.value,
							onClick: () => {
								call(onClick, []);
							},
							primary: primary?.value,
							rounded: rounded?.value,
						};
					}),
				});
				break;
			}

			case 'container': {
				const id = def.value.get('id');
				utils.assertString(id);
				const children = def.value.get('children');
				utils.assertArray(children);
				const align = def.value.get('align');
				if (align) utils.assertString(align);
				const bgColor = def.value.get('bgColor');
				if (bgColor) utils.assertString(bgColor);
				const fgColor = def.value.get('fgColor');
				if (fgColor) utils.assertString(fgColor);
				const font = def.value.get('font');
				if (font) utils.assertString(font);
				const borderWidth = def.value.get('borderWidth');
				if (borderWidth) utils.assertNumber(borderWidth);
				const borderColor = def.value.get('borderColor');
				if (borderColor) utils.assertString(borderColor);
				const padding = def.value.get('padding');
				if (padding) utils.assertNumber(padding);
				const rounded = def.value.get('rounded');
				if (rounded) utils.assertBoolean(rounded);

				res.push({
					id: id.value,
					type: 'container',
					children: render(children.value, call),
					align: align?.value,
					fgColor: fgColor?.value,
					bgColor: bgColor?.value,
					font: font?.value,
					borderWidth: borderWidth?.value,
					borderColor: borderColor?.value,
					padding: padding?.value,
					rounded: rounded?.value,
				});
				break;
			}
		}
	}
	return res;
}

export function patch(id: string, def: values.Value, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>) {
	// TODO
}
