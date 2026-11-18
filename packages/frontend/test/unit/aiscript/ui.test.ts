/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { registerAsUiLib } from '@/aiscript/ui.js';
import { errors, Interpreter, Parser, values } from '@syuilo/aiscript';
import { Interpreter as LegacyInterpreter, Parser as LegacyParser } from '@syuilo/aiscript-0-19-0';
import { describe, expect, test } from 'vitest';
import { ref } from 'vue';
import type {
	AsUiButton,
	AsUiButtons,
	AsUiComponent,
	AsUiMfm,
	AsUiNumberInput,
	AsUiRoot,
	AsUiSelect,
	AsUiSwitch,
	AsUiText,
	AsUiTextarea,
	AsUiTextInput,
} from '@/aiscript/ui.js';

type ExeResult = {
	root: AsUiRoot;
	get: (id: string) => AsUiComponent;
	components: Map<string, AsUiComponent>;
	outputs: values.Value[];
}
async function exe(script: string): Promise<ExeResult> {
	const rootRef = ref<AsUiRoot>();
	const components = new Map<string, AsUiComponent>();
	const outputs: values.Value[] = [];

	const interpreter = new Interpreter(
		registerAsUiLib((root) => {
			rootRef.value = root;
		}, components),
		{
			out: (value) => {
				outputs.push(value);
			}
		}
	);
	const ast = Parser.parse(script);
	await interpreter.exec(ast);

	const root = rootRef.value;
	if (root === undefined) {
		expect.unreachable('root must not be undefined');
	}
	expect(root).toBe(components.get('___root___'));
	expect(root.type).toBe('root');
	const get = (id: string) => {
		const component = components.get(id);
		if (component === undefined) {
			expect.unreachable(`component "${id}" is not defined`);
		}
		return component;
	};
	return { root, get, components, outputs };
}

describe('AiScript UI API', () => {
	test.concurrent('root', async () => {
		const { root } = await exe('');
		expect(root.children).toStrictEqual([]);
	});

	describe('get', () => {
		test.concurrent('some', async () => {
			const { outputs } = await exe(`
				Ui:C:text({}, 'id')
				<: Ui:get('id')
			`);
			const output = outputs[0] as values.VObj;
			expect(output.type).toBe('obj');
			expect(output.value.size).toBe(2);
			expect(output.value.get('id')).toStrictEqual(values.STR('id'));
			expect(output.value.get('update')!.type).toBe('fn');
		});

		test.concurrent('none', async () => {
			const { outputs } = await exe(`
				<: Ui:get('id')
			`);
			expect(outputs).toStrictEqual([values.NULL]);
		});
	});

	describe('update', () => {
		test.concurrent('normal', async () => {
			const { get } = await exe(`
				let text = Ui:C:text({ text: 'a' }, 'id')
				text.update({ text: 'b' })
			`);
			const text = get('id') as AsUiText;
			expect(text.text).toBe('b');
		});

		test.concurrent('skip unknown key', async () => {
			const { get } = await exe(`
				let text = Ui:C:text({ text: 'a' }, 'id')
				text.update({
					text: 'b'
					unknown: null
				})
			`);
			const text = get('id') as AsUiText;
			expect(text.text).toBe('b');
			expect('unknown' in text).toBeFalsy();
		});
	});

	describe('container', () => {
		test.concurrent('all options', async () => {
			const { root, get } = await exe(`
				let text = Ui:C:text({
					text: 'text'
				}, 'id1')
				let container = Ui:C:container({
					children: [text]
					align: 'left'
					bgColor: '#fff'
					fgColor: '#000'
					font: 'sans-serif'
					borderWidth: 1
					borderColor: '#f00'
					borderStyle: 'hidden'
					borderRadius: 2
					padding: 3
					rounded: true
					hidden: false
				}, 'id2')
				Ui:render([container])
			`);
			expect(root.children).toStrictEqual([get('id2')]);
			expect(get('id2')).toStrictEqual({
				type: 'container',
				id: 'id2',
				children: [get('id1')],
				align: 'left',
				bgColor: '#fff',
				fgColor: '#000',
				font: 'sans-serif',
				borderColor: '#f00',
				borderWidth: 1,
				borderStyle: 'hidden',
				borderRadius: 2,
				padding: 3,
				rounded: true,
				hidden: false,
			});
		});

		test.concurrent('minimum options', async () => {
			const { get } = await exe(`
				Ui:C:container({}, 'id')
			`);
			expect(get('id')).toStrictEqual({
				type: 'container',
				id: 'id',
				children: [],
				align: undefined,
				fgColor: undefined,
				bgColor: undefined,
				font: undefined,
				borderWidth: undefined,
				borderColor: undefined,
				borderStyle: undefined,
				borderRadius: undefined,
				padding: undefined,
				rounded: undefined,
				hidden: undefined,
			});
		});

		test.concurrent('invalid children', async () => {
			await expect(() => exe(`
				Ui:C:container({
					children: 0
				})
			`)).rejects.toBeInstanceOf(errors.AiScriptRuntimeError);
		});

		test.concurrent('invalid align', async () => {
			await expect(() => exe(`
				Ui:C:container({
					align: 'invalid'
				})
			`)).rejects.toBeInstanceOf(errors.AiScriptRuntimeError);
		});

		test.concurrent('invalid font', async () => {
			await expect(() => exe(`
				Ui:C:container({
					font: 'invalid'
				})
			`)).rejects.toBeInstanceOf(errors.AiScriptRuntimeError);
		});

		test.concurrent('invalid borderStyle', async () => {
			await expect(() => exe(`
				Ui:C:container({
					borderStyle: 'invalid'
				})
			`)).rejects.toBeInstanceOf(errors.AiScriptRuntimeError);
		});
	});

	describe('text', () => {
		test.concurrent('all options', async () => {
			const { root, get } = await exe(`
				let text = Ui:C:text({
					text: 'a'
					size: 1
					bold: true
					color: '#000'
					font: 'sans-serif'
				}, 'id')
				Ui:render([text])
			`);
			expect(root.children).toStrictEqual([get('id')]);
			expect(get('id')).toStrictEqual({
				type: 'text',
				id: 'id',
				text: 'a',
				size: 1,
				bold: true,
				color: '#000',
				font: 'sans-serif',
			});
		});

		test.concurrent('minimum options', async () => {
			const { get } = await exe(`
				Ui:C:text({}, 'id')
			`);
			expect(get('id')).toStrictEqual({
				type: 'text',
				id: 'id',
				text: undefined,
				size: undefined,
				bold: undefined,
				color: undefined,
				font: undefined,
			});
		});

		test.concurrent('invalid font', async () => {
			await expect(() => exe(`
				Ui:C:text({
					font: 'invalid'
				})
			`)).rejects.toBeInstanceOf(errors.AiScriptRuntimeError);
		});
	});

	describe('mfm', () => {
		test.concurrent('all options', async () => {
			const { root, get, outputs } = await exe(`
				let mfm = Ui:C:mfm({
					text: 'text'
					size: 1
					bold: true
					color: '#000'
					font: 'sans-serif'
					onClickEv: print
				}, 'id')
				Ui:render([mfm])
			`);
			expect(root.children).toStrictEqual([get('id')]);
			const { onClickEv, ...mfm } = get('id') as AsUiMfm;
			expect(mfm).toStrictEqual({
				type: 'mfm',
				id: 'id',
				text: 'text',
				size: 1,
				bold: true,
				color: '#000',
				font: 'sans-serif',
			});
			await onClickEv!('a');
			expect(outputs).toStrictEqual([values.STR('a')]);
		});

		test.concurrent('minimum options', async () => {
			const { get } = await exe(`
				Ui:C:mfm({}, 'id')
			`);
			const { onClickEv, ...mfm } = get('id') as AsUiMfm;
			expect(onClickEv).toBeTypeOf('function');
			expect(mfm).toStrictEqual({
				type: 'mfm',
				id: 'id',
				text: undefined,
				size: undefined,
				bold: undefined,
				color: undefined,
				font: undefined,
			});
		});

		test.concurrent('invalid font', async () => {
			await expect(() => exe(`
				Ui:C:mfm({
					font: 'invalid'
				})
			`)).rejects.toBeInstanceOf(errors.AiScriptRuntimeError);
		});
	});

	describe('textInput', () => {
		test.concurrent('all options', async () => {
			const { root, get, outputs } = await exe(`
				let text_input = Ui:C:textInput({
					onInput: print
					default: 'a'
					label: 'b'
					caption: 'c'
				}, 'id')
				Ui:render([text_input])
			`);
			expect(root.children).toStrictEqual([get('id')]);
			const { onInput, ...textInput } = get('id') as AsUiTextInput;
			expect(textInput).toStrictEqual({
				type: 'textInput',
				id: 'id',
				default: 'a',
				label: 'b',
				caption: 'c',
			});
			await onInput!('d');
			expect(outputs).toStrictEqual([values.STR('d')]);
		});

		test.concurrent('minimum options', async () => {
			const { get } = await exe(`
				Ui:C:textInput({}, 'id')
			`);
			const { onInput, ...textInput } = get('id') as AsUiTextInput;
			expect(onInput).toBeTypeOf('function');
			expect(textInput).toStrictEqual({
				type: 'textInput',
				id: 'id',
				default: undefined,
				label: undefined,
				caption: undefined,
			});
		});
	});

	describe('textarea', () => {
		test.concurrent('all options', async () => {
			const { root, get, outputs } = await exe(`
				let textarea = Ui:C:textarea({
					onInput: print
					default: 'a'
					label: 'b'
					caption: 'c'
				}, 'id')
				Ui:render([textarea])
			`);
			expect(root.children).toStrictEqual([get('id')]);
			const { onInput, ...textarea } = get('id') as AsUiTextarea;
			expect(textarea).toStrictEqual({
				type: 'textarea',
				id: 'id',
				default: 'a',
				label: 'b',
				caption: 'c',
			});
			await onInput!('d');
			expect(outputs).toStrictEqual([values.STR('d')]);
		});

		test.concurrent('minimum options', async () => {
			const { get } = await exe(`
				Ui:C:textarea({}, 'id')
			`);
			const { onInput, ...textarea } = get('id') as AsUiTextarea;
			expect(onInput).toBeTypeOf('function');
			expect(textarea).toStrictEqual({
				type: 'textarea',
				id: 'id',
				default: undefined,
				label: undefined,
				caption: undefined,
			});
		});
	});

	describe('numberInput', () => {
		test.concurrent('all options', async () => {
			const { root, get, outputs } = await exe(`
				let number_input = Ui:C:numberInput({
					onInput: print
					default: 1
					label: 'a'
					caption: 'b'
				}, 'id')
				Ui:render([number_input])
			`);
			expect(root.children).toStrictEqual([get('id')]);
			const { onInput, ...numberInput } = get('id') as AsUiNumberInput;
			expect(numberInput).toStrictEqual({
				type: 'numberInput',
				id: 'id',
				default: 1,
				label: 'a',
				caption: 'b',
			});
			await onInput!(2);
			expect(outputs).toStrictEqual([values.NUM(2)]);
		});

		test.concurrent('minimum options', async () => {
			const { get } = await exe(`
				Ui:C:numberInput({}, 'id')
			`);
			const { onInput, ...numberInput } = get('id') as AsUiNumberInput;
			expect(onInput).toBeTypeOf('function');
			expect(numberInput).toStrictEqual({
				type: 'numberInput',
				id: 'id',
				default: undefined,
				label: undefined,
				caption: undefined,
			});
		});
	});

	describe('button', () => {
		test.concurrent('all options', async () => {
			const { root, get, outputs } = await exe(`
				let button = Ui:C:button({
					text: 'a'
					onClick: @() { <: 'clicked' }
					primary: true
					rounded: false
					disabled: false
				}, 'id')
				Ui:render([button])
			`);
			expect(root.children).toStrictEqual([get('id')]);
			const { onClick, ...button } = get('id') as AsUiButton;
			expect(button).toStrictEqual({
				type: 'button',
				id: 'id',
				text: 'a',
				primary: true,
				rounded: false,
				disabled: false,
			});
			await onClick!();
			expect(outputs).toStrictEqual([values.STR('clicked')]);
		});

		test.concurrent('minimum options', async () => {
			const { get } = await exe(`
				Ui:C:button({}, 'id')
			`);
			const { onClick, ...button } = get('id') as AsUiButton;
			expect(onClick).toBeTypeOf('function');
			expect(button).toStrictEqual({
				type: 'button',
				id: 'id',
				text: undefined,
				primary: undefined,
				rounded: undefined,
				disabled: undefined,
			});
		});
	});

	describe('buttons', () => {
		test.concurrent('all options', async () => {
			const { root, get } = await exe(`
				let buttons = Ui:C:buttons({
					buttons: []
				}, 'id')
				Ui:render([buttons])
			`);
			expect(root.children).toStrictEqual([get('id')]);
			expect(get('id')).toStrictEqual({
				type: 'buttons',
				id: 'id',
				buttons: [],
			});
		});

		test.concurrent('minimum options', async () => {
			const { get } = await exe(`
				Ui:C:buttons({}, 'id')
			`);
			expect(get('id')).toStrictEqual({
				type: 'buttons',
				id: 'id',
				buttons: [],
			});
		});

		test.concurrent('some buttons', async () => {
			const { root, get, outputs } = await exe(`
				let buttons = Ui:C:buttons({
					buttons: [
						{
							text: 'a'
							onClick: @() { <: 'clicked a' }
							primary: true
							rounded: false
							disabled: false
						}
						{
							text: 'b'
							onClick: @() { <: 'clicked b' }
							primary: true
							rounded: false
							disabled: false
						}
					]
				}, 'id')
				Ui:render([buttons])
			`);
			expect(root.children).toStrictEqual([get('id')]);
			const { buttons, ...buttonsOptions } = get('id') as AsUiButtons;
			expect(buttonsOptions).toStrictEqual({
				type: 'buttons',
				id: 'id',
			});
			expect(buttons!.length).toBe(2);
			const { onClick: onClickA, ...buttonA } = buttons![0];
			expect(buttonA).toStrictEqual({
				text: 'a',
				primary: true,
				rounded: false,
				disabled: false,
			});
			const { onClick: onClickB, ...buttonB } = buttons![1];
			expect(buttonB).toStrictEqual({
				text: 'b',
				primary: true,
				rounded: false,
				disabled: false,
			});
			await onClickA!();
			await onClickB!();
			expect(outputs).toStrictEqual(
				[values.STR('clicked a'), values.STR('clicked b')]
			);
		});
	});

	describe('switch', () => {
		test.concurrent('all options', async () => {
			const { root, get, outputs } = await exe(`
				let switch = Ui:C:switch({
					onChange: print
					default: false
					label: 'a'
					caption: 'b'
				}, 'id')
				Ui:render([switch])
			`);
			expect(root.children).toStrictEqual([get('id')]);
			const { onChange, ...switchOptions } = get('id') as AsUiSwitch;
			expect(switchOptions).toStrictEqual({
				type: 'switch',
				id: 'id',
				default: false,
				label: 'a',
				caption: 'b',
			});
			await onChange!(true);
			expect(outputs).toStrictEqual([values.TRUE]);
		});

		test.concurrent('minimum options', async () => {
			const { get } = await exe(`
				Ui:C:switch({}, 'id')
			`);
			const { onChange, ...switchOptions } = get('id') as AsUiSwitch;
			expect(onChange).toBeTypeOf('function');
			expect(switchOptions).toStrictEqual({
				type: 'switch',
				id: 'id',
				default: undefined,
				label: undefined,
				caption: undefined,
			});
		});
	});

	describe('select', () => {
		test.concurrent('all options', async () => {
			const { root, get, outputs } = await exe(`
				let select = Ui:C:select({
					items: [
						{ text: 'A', value: 'a' }
						{ text: 'B', value: 'b' }
					]
					onChange: print
					default: 'a'
					label: 'c'
					caption: 'd'
				}, 'id')
				Ui:render([select])
			`);
			expect(root.children).toStrictEqual([get('id')]);
			const { onChange, ...select } = get('id') as AsUiSelect;
			expect(select).toStrictEqual({
				type: 'select',
				id: 'id',
				items: [
					{ text: 'A', value: 'a' },
					{ text: 'B', value: 'b' },
				],
				default: 'a',
				label: 'c',
				caption: 'd',
			});
			await onChange!('b');
			expect(outputs).toStrictEqual([values.STR('b')]);
		});

		test.concurrent('minimum options', async () => {
			const { get } = await exe(`
				Ui:C:select({}, 'id')
			`);
			const { onChange, ...select } = get('id') as AsUiSelect;
			expect(onChange).toBeTypeOf('function');
			expect(select).toStrictEqual({
				type: 'select',
				id: 'id',
				items: [],
				default: undefined,
				label: undefined,
				caption: undefined,
			});
		});

		test.concurrent('omit item values', async () => {
			const { get } = await exe(`
				let select = Ui:C:select({
					items: [
						{ text: 'A' }
						{ text: 'B' }
					]
				}, 'id')
			`);
			const { onChange, ...select } = get('id') as AsUiSelect;
			expect(onChange).toBeTypeOf('function');
			expect(select).toStrictEqual({
				type: 'select',
				id: 'id',
				items: [
					{ text: 'A', value: 'A' },
					{ text: 'B', value: 'B' },
				],
				default: undefined,
				label: undefined,
				caption: undefined,
			});
		});
	});

	describe('folder', () => {
		test.concurrent('all options', async () => {
			const { root, get } = await exe(`
				let folder = Ui:C:folder({
					children: []
					title: 'a'
					opened: true
				}, 'id')
				Ui:render([folder])
			`);
			expect(root.children).toStrictEqual([get('id')]);
			expect(get('id')).toStrictEqual({
				type: 'folder',
				id: 'id',
				children: [],
				title: 'a',
				opened: true,
			});
		});

		test.concurrent('minimum options', async () => {
			const { get } = await exe(`
				Ui:C:folder({}, 'id')
			`);
			expect(get('id')).toStrictEqual({
				type: 'folder',
				id: 'id',
				children: [],
				title: '',
				opened: true,
			});
		});

		test.concurrent('some children', async () => {
			const { get } = await exe(`
				let text = Ui:C:text({
					text: 'text'
				}, 'id1')
				Ui:C:folder({
					children: [text]
				}, 'id2')
			`);
			expect(get('id2')).toStrictEqual({
				type: 'folder',
				id: 'id2',
				children: [get('id1')],
				title: '',
				opened: true,
			});
		});
	});

	describe('postFormButton', () => {
		test.concurrent('all options', async () => {
			const { root, get } = await exe(`
				let post_form_button = Ui:C:postFormButton({
					text: 'a'
					primary: true
					rounded: false
					form: {
						text: 'b'
						cw: 'c'
						visibility: 'public'
						localOnly: true
					}
				}, 'id')
				Ui:render([post_form_button])
			`);
			expect(root.children).toStrictEqual([get('id')]);
			expect(get('id')).toStrictEqual({
				type: 'postFormButton',
				id: 'id',
				text: 'a',
				primary: true,
				rounded: false,
				form: {
					text: 'b',
					cw: 'c',
					visibility: 'public',
					localOnly: true,
				},
			});
		});

		test.concurrent('minimum options', async () => {
			const { get } = await exe(`
				Ui:C:postFormButton({}, 'id')
			`);
			expect(get('id')).toStrictEqual({
				type: 'postFormButton',
				id: 'id',
				text: undefined,
				primary: undefined,
				rounded: undefined,
				form: { text: '' },
			});
		});
	});

	describe('postForm', () => {
		test.concurrent('all options', async () => {
			const { root, get } = await exe(`
				let post_form = Ui:C:postForm({
					form: {
						text: 'a'
						cw: 'b'
						visibility: 'public'
						localOnly: true
					}
				}, 'id')
				Ui:render([post_form])
			`);
			expect(root.children).toStrictEqual([get('id')]);
			expect(get('id')).toStrictEqual({
				type: 'postForm',
				id: 'id',
				form: {
					text: 'a',
					cw: 'b',
					visibility: 'public',
					localOnly: true,
				},
			});
		});

		test.concurrent('minimum options', async () => {
			const { get } = await exe(`
				Ui:C:postForm({}, 'id')
			`);
			expect(get('id')).toStrictEqual({
				type: 'postForm',
				id: 'id',
				form: { text: '' },
			});
		});

		test.concurrent('minimum options for form', async () => {
			const { get } = await exe(`
				Ui:C:postForm({
					form: { text: '' }
				}, 'id')
			`);
			expect(get('id')).toStrictEqual({
				type: 'postForm',
				id: 'id',
				form: {
					text: '',
					cw: undefined,
					visibility: undefined,
					localOnly: undefined,
				},
			});
		});
	});

	describe('retention', () => {
		test.concurrent('component without id is not retained', async () => {
			const { root, components } = await exe(`
				Ui:render([Ui:C:text({ text: 'a' })])
			`);
			expect([...components.keys()]).toStrictEqual(['___root___']);
			expect(root.children).toMatchObject([{ type: 'text', text: 'a' }]);
		});

		test.concurrent('component is retained once its id is read', async () => {
			const { outputs } = await exe(`
				let id = Ui:C:text({ text: 'a' }).id
				<: Ui:get(id).id == id
			`);
			expect(outputs).toStrictEqual([values.TRUE]);
		});

		test.concurrent('component is retained once its props are enumerated', async () => {
			const { components } = await exe(`
				let text = Ui:C:text({ text: 'a' })
				Obj:vals(text)
			`);
			expect(components.size).toBe(2);
		});

		test.concurrent('component is retained once its id is read (legacy interpreter)', async () => {
			const components = new Map<string, AsUiComponent>();
			const outputs: unknown[] = [];
			const interpreter = new LegacyInterpreter(
				registerAsUiLib(() => {}, components) as unknown as ConstructorParameters<typeof LegacyInterpreter>[0],
				{
					out: (value) => {
						outputs.push(value);
					},
				},
			);
			await interpreter.exec(new LegacyParser().parse(`
				let id = Ui:C:text({ text: 'a' }).id
				<: Ui:get(id).id == id
			`));
			expect(outputs).toMatchObject([{ type: 'bool', value: true }]);
		});
	});

	describe('same id', () => {
		test.concurrent('later definition wins', async () => {
			const { root, get } = await exe(`
				let text1 = Ui:C:text({ text: 'a' }, 'id')
				let text2 = Ui:C:text({ text: 'b' }, 'id')
				Ui:render([text1, text2])
			`);
			expect(root.children).toStrictEqual([get('id'), get('id')]);
			expect(get('id')).toMatchObject({ type: 'text', text: 'b' });
		});

		test.concurrent('old instance updates the same component', async () => {
			const { get } = await exe(`
				let text1 = Ui:C:text({ text: 'a' }, 'id')
				Ui:C:text({ text: 'b' }, 'id')
				text1.update({ text: 'c' })
			`);
			expect(get('id')).toMatchObject({ type: 'text', text: 'c' });
		});

		test.concurrent('type can be changed', async () => {
			const { root, get } = await exe(`
				let container = Ui:C:container({ padding: 1 }, 'id')
				Ui:render([container])
				Ui:C:text({ text: 'a' }, 'id')
			`);
			expect(root.children).toStrictEqual([get('id')]);
			expect(get('id')).toStrictEqual({
				type: 'text',
				id: 'id',
				text: 'a',
				size: undefined,
				bold: undefined,
				color: undefined,
				font: undefined,
			});
		});

		test.concurrent('child referenced by id before creation', async () => {
			const { root, get } = await exe(`
				Ui:render([{ id: 'id' }])
				Ui:C:text({ text: 'a' }, 'id')
			`);
			expect(root.children).toStrictEqual([get('id')]);
			expect(get('id')).toMatchObject({ type: 'text', text: 'a' });
		});

		test.concurrent('root id is reserved', async () => {
			await expect(() => exe(`
				Ui:C:text({}, '___root___')
			`)).rejects.toBeInstanceOf(errors.AiScriptRuntimeError);
		});
	});
});
