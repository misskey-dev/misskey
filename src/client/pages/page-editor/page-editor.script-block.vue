<template>
<XContainer :removable="removable" @remove="() => $emit('remove')" :error="error" :warn="warn" :draggable="draggable">
	<template #header><Fa v-if="icon" :icon="icon"/> <template v-if="title">{{ title }} <span class="turmquns" v-if="typeText">({{ typeText }})</span></template><template v-else-if="typeText">{{ typeText }}</template></template>
	<template #func>
		<button @click="changeType()" class="_button">
			<Fa :icon="faPencilAlt"/>
		</button>
	</template>

	<section v-if="value.type === null" class="pbglfege" @click="changeType()">
		{{ $t('_pages.script.emptySlot') }}
	</section>
	<section v-else-if="value.type === 'text'" class="tbwccoaw">
		<input v-model="value.value"/>
	</section>
	<section v-else-if="value.type === 'multiLineText'" class="tbwccoaw">
		<textarea v-model="value.value"></textarea>
	</section>
	<section v-else-if="value.type === 'textList'" class="tbwccoaw">
		<textarea v-model="value.value" :placeholder="$t('_pages.script.blocks._textList.info')"></textarea>
	</section>
	<section v-else-if="value.type === 'number'" class="tbwccoaw">
		<input v-model="value.value" type="number"/>
	</section>
	<section v-else-if="value.type === 'ref'" class="hpdwcrvs">
		<select v-model="value.value">
			<option v-for="v in hpml.getVarsByType(getExpectedType ? getExpectedType() : null).filter(x => x.name !== name)" :value="v.name">{{ v.name }}</option>
			<optgroup :label="$t('_pages.script.argVariables')">
				<option v-for="v in fnSlots" :value="v.name">{{ v.name }}</option>
			</optgroup>
			<optgroup :label="$t('_pages.script.pageVariables')">
				<option v-for="v in hpml.getPageVarsByType(getExpectedType ? getExpectedType() : null)" :value="v">{{ v }}</option>
			</optgroup>
			<optgroup :label="$t('_pages.script.enviromentVariables')">
				<option v-for="v in hpml.getEnvVarsByType(getExpectedType ? getExpectedType() : null)" :value="v">{{ v }}</option>
			</optgroup>
		</select>
	</section>
	<section v-else-if="value.type === 'aiScriptVar'" class="tbwccoaw">
		<input v-model="value.value"/>
	</section>
	<section v-else-if="value.type === 'fn'" class="" style="padding:0 16px 16px 16px;">
		<MkTextarea v-model:value="slots">
			<span>{{ $t('_pages.script.blocks._fn.slots') }}</span>
			<template #desc>{{ $t('_pages.script.blocks._fn.slots-info') }}</template>
		</MkTextarea>
		<XV v-if="value.value.expression" v-model:value="value.value.expression" :title="$t(`_pages.script.blocks._fn.arg1`)" :get-expected-type="() => null" :hpml="hpml" :fn-slots="value.value.slots" :name="name"/>
	</section>
	<section v-else-if="value.type.startsWith('fn:')" class="" style="padding:16px;">
		<XV v-for="(x, i) in value.args" v-model:value="value.args[i]" :title="hpml.getVarByName(value.type.split(':')[1]).value.slots[i].name" :get-expected-type="() => null" :hpml="hpml" :name="name" :key="i"/>
	</section>
	<section v-else class="" style="padding:16px;">
		<XV v-for="(x, i) in value.args" v-model:value="value.args[i]" :title="$t(`_pages.script.blocks._${value.type}.arg${i + 1}`)" :get-expected-type="() => _getExpectedType(i)" :hpml="hpml" :name="name" :fn-slots="fnSlots" :key="i"/>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faPencilAlt, faPlug } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuid } from 'uuid';
import XContainer from './page-editor.container.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import { isLiteralBlock, funcDefs, blockDefs } from '@/scripts/hpml/index';
import * as os from '@/os';

export default defineComponent({
	components: {
		XContainer, MkTextarea,
		XV: defineAsyncComponent(() => import('./page-editor.script-block.vue')),
	},

	inject: ['getScriptBlockList'],

	props: {
		getExpectedType: {
			required: false,
			default: null
		},
		value: {
			required: true
		},
		title: {
			required: false
		},
		removable: {
			required: false,
			default: false
		},
		hpml: {
			required: true,
		},
		name: {
			required: true,
		},
		fnSlots: {
			required: false,
		},
		draggable: {
			required: false,
			default: false
		}
	},

	data() {
		return {
			error: null,
			warn: null,
			slots: '',
			faPencilAlt
		};
	},

	computed: {
		icon(): any {
			if (this.value.type === null) return null;
			if (this.value.type.startsWith('fn:')) return faPlug;
			return blockDefs.find(x => x.type === this.value.type).icon;
		},
		typeText(): any {
			if (this.value.type === null) return null;
			if (this.value.type.startsWith('fn:')) return this.value.type.split(':')[1];
			return this.$t(`_pages.script.blocks.${this.value.type}`);
		},
	},

	watch: {
		slots: {
			handler() {
				this.value.value.slots = this.slots.split('\n').map(x => ({
					name: x,
					type: null
				}));
			},
			deep: true
		}
	},

	created() {
		if (this.value.value == null) this.value.value = null;

		if (this.value.value && this.value.value.slots) this.slots = this.value.value.slots.map(x => x.name).join('\n');

		this.$watch(() => this.value.type, (t) => {
			this.warn = null;

			if (this.value.type === 'fn') {
				const id = uuid();
				this.value.value = {
					slots: [],
					expression: { id, type: null }
				};
				return;
			}

			if (this.value.type && this.value.type.startsWith('fn:')) {
				const fnName = this.value.type.split(':')[1];
				const fn = this.hpml.getVarByName(fnName);

				const empties = [];
				for (let i = 0; i < fn.value.slots.length; i++) {
					const id = uuid();
					empties.push({ id, type: null });
				}
				this.value.args = empties;
				return;
			}

			if (isLiteralBlock(this.value)) return;

			const empties = [];
			for (let i = 0; i < funcDefs[this.value.type].in.length; i++) {
				const id = uuid();
				empties.push({ id, type: null });
			}
			this.value.args = empties;

			for (let i = 0; i < funcDefs[this.value.type].in.length; i++) {
				const inType = funcDefs[this.value.type].in[i];
				if (typeof inType !== 'number') {
					if (inType === 'number') this.value.args[i].type = 'number';
					if (inType === 'string') this.value.args[i].type = 'text';
				}
			}
		});

		this.$watch(() => this.value.args, (args) => {
			if (args == null) {
				this.warn = null;
				return;
			}
			const emptySlotIndex = args.findIndex(x => x.type === null);
			if (emptySlotIndex !== -1 && emptySlotIndex < args.length) {
				this.warn = {
					slot: emptySlotIndex
				};
			} else {
				this.warn = null;
			}
		}, {
			deep: true
		});

		this.$watch(() => this.hpml.variables, () => {
			if (this.type != null && this.value) {
				this.error = this.hpml.typeCheck(this.value);
			}
		}, {
			deep: true
		});
	},

	methods: {
		async changeType() {
			const { canceled, result: type } = await os.dialog({
				type: null,
				title: this.$t('_pages.selectType'),
				select: {
					groupedItems: this.getScriptBlockList(this.getExpectedType ? this.getExpectedType() : null)
				},
				showCancelButton: true
			});
			if (canceled) return;
			this.value.type = type;
		},

		_getExpectedType(slot: number) {
			return this.hpml.getExpectedType(this.value, slot);
		}
	}
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
