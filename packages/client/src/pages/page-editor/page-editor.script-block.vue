<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :removable="removable" :error="error" :warn="warn" :draggable="draggable" @remove="() => $emit('remove')">
	<template #header><i v-if="icon" :class="icon"></i> <template v-if="title">{{ title }} <span v-if="typeText" class="turmquns">({{ typeText }})</span></template><template v-else-if="typeText">{{ typeText }}</template></template>
	<template #func>
		<button class="_button" @click="changeType()">
			<i class="fas fa-pencil-alt"></i>
		</button>
	</template>

	<section v-if="modelValue.type === null" class="pbglfege" @click="changeType()">
		{{ $ts._pages.script.emptySlot }}
	</section>
	<section v-else-if="modelValue.type === 'text'" class="tbwccoaw">
		<input v-model="modelValue.value"/>
	</section>
	<section v-else-if="modelValue.type === 'multiLineText'" class="tbwccoaw">
		<textarea v-model="modelValue.value"></textarea>
	</section>
	<section v-else-if="modelValue.type === 'textList'" class="tbwccoaw">
		<textarea v-model="modelValue.value" :placeholder="$ts._pages.script.blocks._textList.info"></textarea>
	</section>
	<section v-else-if="modelValue.type === 'number'" class="tbwccoaw">
		<input v-model="modelValue.value" type="number"/>
	</section>
	<section v-else-if="modelValue.type === 'ref'" class="hpdwcrvs">
		<select v-model="modelValue.value">
			<option v-for="v in hpml.getVarsByType(getExpectedType ? getExpectedType() : null).filter(x => x.name !== name)" :value="v.name">{{ v.name }}</option>
			<optgroup :label="$ts._pages.script.argVariables">
				<option v-for="v in fnSlots" :value="v.name">{{ v.name }}</option>
			</optgroup>
			<optgroup :label="$ts._pages.script.pageVariables">
				<option v-for="v in hpml.getPageVarsByType(getExpectedType ? getExpectedType() : null)" :value="v">{{ v }}</option>
			</optgroup>
			<optgroup :label="$ts._pages.script.enviromentVariables">
				<option v-for="v in hpml.getEnvVarsByType(getExpectedType ? getExpectedType() : null)" :value="v">{{ v }}</option>
			</optgroup>
		</select>
	</section>
	<section v-else-if="modelValue.type === 'aiScriptVar'" class="tbwccoaw">
		<input v-model="modelValue.value"/>
	</section>
	<section v-else-if="modelValue.type === 'fn'" class="" style="padding:0 16px 16px 16px;">
		<MkTextarea v-model="slots">
			<template #label>{{ $ts._pages.script.blocks._fn.slots }}</template>
			<template #caption>{{ $t('_pages.script.blocks._fn.slots-info') }}</template>
		</MkTextarea>
		<XV v-if="modelValue.value.expression" v-model="modelValue.value.expression" :title="$t(`_pages.script.blocks._fn.arg1`)" :get-expected-type="() => null" :hpml="hpml" :fn-slots="modelValue.value.slots" :name="name"/>
	</section>
	<section v-else-if="modelValue.type.startsWith('fn:')" class="" style="padding:16px;">
		<XV v-for="(x, i) in modelValue.args" :key="i" v-model="modelValue.args[i]" :title="hpml.getVarByName(modelValue.type.split(':')[1]).value.slots[i].name" :get-expected-type="() => null" :hpml="hpml" :name="name"/>
	</section>
	<section v-else class="" style="padding:16px;">
		<XV v-for="(x, i) in modelValue.args" :key="i" v-model="modelValue.args[i]" :title="$t(`_pages.script.blocks._${modelValue.type}.arg${i + 1}`)" :get-expected-type="() => _getExpectedType(i)" :hpml="hpml" :name="name" :fn-slots="fnSlots"/>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-mutating-props */
import { defineAsyncComponent, inject, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import XContainer from './page-editor.container.vue';
import MkTextarea from '@/components/form/textarea.vue';
import { blockDefs } from '@/scripts/hpml/index';
import * as os from '@/os';
import { isLiteralValue } from '@/scripts/hpml/expr';
import { funcDefs } from '@/scripts/hpml/lib';
import { i18n } from '@/i18n';

const XV = defineAsyncComponent(() => import('./page-editor.script-block.vue'));

const props = withDefaults(defineProps<{
	getExpectedType?: any,
	modelValue: any,
	title?: string,
	removable?: boolean,
	hpml: any,
	name: string,
	fnSlots?: any,
	draggable?: boolean
}>(), {
	getExpectedType: null,
	removable: false,
	draggable: false
});

let error: any = $ref(null);
let warn: any = $ref(null);
let slots: string = $ref('');

let getScriptBlockList = inject<(any) => any>('getScriptBlockList');

let icon = $computed(() => {
	if (props.modelValue.type === null) return null;
	if (props.modelValue.type.startsWith('fn:')) return 'fas fa-plug';

	return blockDefs.find(x => x.type === props.modelValue.type)!.icon;	
});

let typeText = $computed(() => {
	if (props.modelValue.type === null) return null;
	if (props.modelValue.type.startsWith('fn:')) return props.modelValue.type.split(':')[1];

	return i18n.t(`_pages.script.blocks.${props.modelValue.type}`);
});

watch(() => slots, () => {
	props.modelValue.value.slots = slots.split('\n').map(x => ({
		name: x,
		type: null
	}));
});

async function changeType() {
	const { canceled, result: type } = await os.select({
		title: i18n.ts._pages.selectType,
		groupedItems: getScriptBlockList!(props.getExpectedType ? getExpectedType() : null)
	});
	if (canceled) return;

	props.modelValue.type = type;
}

function _getExpectedType(slot: number) {
	return props.hpml.getExpectedType(props.modelValue, slot);
}

if (props.modelValue.value == null) props.modelValue.value = null;

if (props.modelValue.value && props.modelValue.value.slots) slots = props.modelValue.value.slots.map(x => x.name).join('\n');

watch(() => props.modelValue.type, (t) => {
	warn = null;

	if (props.modelValue.type === 'fn') {
		const id = uuid();
		props.modelValue.value = {
			slots: [],
			expression: { id, type: null }
		};
		return;
	}

	if (props.modelValue.type && props.modelValue.type.startsWith('fn:')) {
		const fnName = props.modelValue.type.split(':')[1];
		const fn = props.hpml.getVarByName(fnName);

		const empties: any[] = [];
		for (let i = 0; i < fn.value.slots.length; i++) {
			const id = uuid();
			empties.push({ id, type: null });
		}
		props.modelValue.args = empties;
		return;
	}

	if (isLiteralValue(props.modelValue)) return;

	const empties: any[] = [];
	for (let i = 0; i < funcDefs[props.modelValue.type].in.length; i++) {
		const id = uuid();
		empties.push({ id, type: null });
	}
	props.modelValue.args = empties;

	for (let i = 0; i < funcDefs[props.modelValue.type].in.length; i++) {
		const inType = funcDefs[props.modelValue.type].in[i];
		if (typeof inType !== 'number') {
			if (inType === 'number') props.modelValue.args[i].type = 'number';
			if (inType === 'string') props.modelValue.args[i].type = 'text';
		}
	}
});

watch(() => props.modelValue.args, (args) => {
	if (args == null) {
		warn = null;
		return;
	}
	const emptySlotIndex = args.findIndex(x => x.type === null);
	if (emptySlotIndex !== -1 && emptySlotIndex < args.length) {
		warn = {
			slot: emptySlotIndex
		};
	} else {
		warn = null;
	}
}, {
	deep: true
});
</script>

<style lang="scss" scoped>
.turmquns {
	opacity: 0.7;
}

.pbglfege {
	opacity: 0.5;
	padding: 16px;
	text-align: center;
	cursor: pointer;
	color: var(--fg);
}

.tbwccoaw {
	> input,
	> textarea {
		display: block;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		width: 100%;
		max-width: 100%;
		min-width: 100%;
		border: none;
		box-shadow: none;
		padding: 16px;
		font-size: 16px;
		background: transparent;
		color: var(--fg);
		box-sizing: border-box;
	}

	> textarea {
		min-height: 100px;
	}
}

.hpdwcrvs {
	padding: 16px;

	> select {
		display: block;
		padding: 4px;
		font-size: 16px;
		width: 100%;
	}
}
</style>
