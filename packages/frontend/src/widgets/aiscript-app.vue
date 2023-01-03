<template>
<MkContainer :show-header="widgetProps.showHeader" class="mkw-aiscriptApp">
	<template #header>App</template>
	<div :class="$style.root">
		<MkAsUi :definition="ui" size="small"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Interpreter, Parser, utils, values } from '@syuilo/aiscript';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import * as os from '@/os';
import { createAiScriptEnv } from '@/scripts/aiscript/api';
import { $i } from '@/account';
import MkAsUi from '@/components/MkAsUi.vue';
import MkContainer from '@/components/MkContainer.vue';
import { AsUiComponent } from '@/scripts/aiscript/ui';

const name = 'aiscriptApp';

const widgetPropsDef = {
	script: {
		type: 'string' as const,
		multiline: true,
		default: '',
	},
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

// 現時点ではvueの制限によりimportしたtypeをジェネリックに渡せない
//const props = defineProps<WidgetComponentProps<WidgetProps>>();
//const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const props = defineProps<{ widget?: Widget<WidgetProps>; }>();
const emit = defineEmits<{ (ev: 'updateProps', props: WidgetProps); }>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const parser = new Parser();

let ui = $ref<AsUiComponent[]>();

function render(defs: values.Value[], call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>) {
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

				res.push({
					id: id.value,
					type: 'text',
					text: text.value,
					size: size?.value,
					bold: bold?.value,
				});
				break;
			}
		
			case 'textInput': {
				const id = def.value.get('id');
				utils.assertString(id);
				const onInput = def.value.get('onInput');
				utils.assertFunction(onInput);

				res.push({
					id: id.value,
					type: 'textInput',
					onInput: (v) => {
						call(onInput, [utils.jsToVal(v)]);
					},
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

				res.push({
					id: id.value,
					type: 'container',
					children: render(children.value, call),
					align: align?.value,
				});
				break;
			}
		}
	}
	return res;
}

function patch(id: string, def: values.Value, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>) {
	// TODO
}

const run = async () => {
	const aiscript = new Interpreter({
		...createAiScriptEnv({
			storageKey: 'widget',
			token: $i?.token,
		}),
		'Mk:Ui:render': values.FN_NATIVE(async ([defs], opts) => {
			utils.assertArray(defs);
			ui = render(defs.value, opts.call);
		}),
		'Mk:Ui:patch': values.FN_NATIVE(async ([id, val], opts) => {
			utils.assertString(id);
			utils.assertArray(val);
			patch(id.value, val.value, opts.call);
		}),
	}, {
		in: (q) => {
			return new Promise(ok => {
				os.inputText({
					title: q,
				}).then(({ canceled, result: a }) => {
					ok(a);
				});
			});
		},
		out: (value) => {
			// nop
		},
		log: (type, params) => {
			// nop
		},
	});

	let ast;
	try {
		ast = parser.parse(widgetProps.script);
	} catch (err) {
		os.alert({
			type: 'error',
			text: 'Syntax error :(',
		});
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (err) {
		os.alert({
			type: 'error',
			title: 'AiScript Error',
			text: err.message,
		});
	}
};

watch(() => widgetProps.script, () => {
	run();
});

onMounted(() => {
	run();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	padding: 16px;
}
</style>
