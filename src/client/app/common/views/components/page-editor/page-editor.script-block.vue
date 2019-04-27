<template>
<x-container :removable="removable" :error="error" :warn="warn">
	<template #header><fa v-if="icon" :icon="icon"/> <template v-if="title">{{ title }} <span class="turmquns" v-if="typeText">({{ typeText }})</span></template><template v-else-if="typeText">{{ typeText }}</template></template>
	<template #func>
		<button @click="changeType()">
			<fa :icon="faPencilAlt"/>
		</button>
	</template>

	<section v-if="value.type === null" class="pbglfege" @click="changeType()">
		{{ $t('script.emptySlot') }}
	</section>
	<section v-else-if="value.type === 'text'" class="tbwccoaw">
		<input v-model="value.value"/>
	</section>
	<section v-else-if="value.type === 'multiLineText'" class="tbwccoaw">
		<textarea v-model="value.value"></textarea>
	</section>
	<section v-else-if="value.type === 'textList'" class="tbwccoaw">
		<textarea v-model="value.value"></textarea>
	</section>
	<section v-else-if="value.type === 'number'" class="tbwccoaw">
		<input v-model="value.value" type="number"/>
	</section>
	<section v-else-if="value.type === 'ref'" class="hpdwcrvs">
		<select v-model="value.value">
			<option v-for="v in aiScript.getVariablesByType(getExpectedType ? getExpectedType() : null).filter(x => x.name !== name)" :value="v.name">{{ v.name }}</option>
			<optgroup :label="$t('script.pageVariables')">
				<option v-for="v in aiScript.getPageVarsByType(getExpectedType ? getExpectedType() : null)" :value="v">{{ v }}</option>
			</optgroup>
			<optgroup :label="$t('script.enviromentVariables')">
				<option v-for="v in aiScript.getEnvVarsByType(getExpectedType ? getExpectedType() : null)" :value="v">{{ v }}</option>
			</optgroup>
		</select>
	</section>
	<section v-else class="" style="padding:16px;">
		<x-v v-for="(x, i) in value.args" v-model="value.args[i]" :title="$t(`script.blocks._${value.type}.arg${i + 1}`)" :get-expected-type="() => _getExpectedType(i)" :ai-script="aiScript" :name="name" :key="i"/>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import XContainer from './page-editor.container.vue';
import { faSuperscript, faPencilAlt, faSquareRootAlt } from '@fortawesome/free-solid-svg-icons';
import { AiScript } from '../../../scripts/aiscript';

export default Vue.extend({
	i18n: i18n('pages'),

	components: {
		XContainer
	},

	inject: ['getScriptItemList'],

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
		aiScript: {
			required: true,
		},
		name: {
			required: true,
		},
	},

	data() {
		return {
			AiScript,
			error: null,
			warn: null,
			faSuperscript, faPencilAlt, faSquareRootAlt
		};
	},

	computed: {
		icon(): any {
			if (this.value.type === null) return null;
			return AiScript.blockDefs.find(x => x.type === this.value.type).icon;
		},
		typeText(): any {
			if (this.value.type === null) return null;
			return this.$t(`script.blocks.${this.value.type}`);
		},
	},

	beforeCreate() {
		this.$options.components.XV = require('./page-editor.script-block.vue').default;
	},

	created() {
		if (this.value.value == null) Vue.set(this.value, 'value', '');

		if (this.value.args == null) {
			this.init();
		}

		this.$watch('value.type', (t) => {
			this.init();
		});

		this.$watch('value.args', (args) => {
			if (args == null) {
				this.warn = null;
				return;
			}
			const fn = AiScript.funcDefs[this.value.type];
			const emptySlotIndex = args.findIndex(x => x.type === null);
			if (emptySlotIndex !== -1 && emptySlotIndex < fn.in.length) {
				this.warn = {
					slot: emptySlotIndex
				};
			} else {
				this.warn = null;
			}
		}, {
			deep: true
		});

		this.$watch('aiScript.variables', () => {
			if (this.type != null && this.value) {
				this.error = this.aiScript.typeCheck(this.value);
			}
		}, {
			deep: true
		});
	},

	methods: {
		init() {
			this.warn = null;

			if (AiScript.isLiteralBlock(this.value)) {
				return;
			}

			const empties = [];
			for (let i = 0; i < AiScript.funcDefs[this.value.type].in.length; i++) {
				empties.push({ type: null });
			}
			Vue.set(this.value, 'args', empties);

			for (let i = 0; i < AiScript.funcDefs[this.value.type].in.length; i++) {
				const inType = AiScript.funcDefs[this.value.type].in[i];
				if (typeof inType !== 'number') {
					if (inType === 'number') this.value.args[i].type = 'number';
					if (inType === 'string') this.value.args[i].type = 'text';
				}
			}
		},

		async changeType() {
			const { canceled, result: type } = await this.$root.dialog({
				type: null,
				title: 'Select type',
				select: {
					items: this.getScriptItemList(this.getExpectedType ? this.getExpectedType() : null)
				},
				showCancelButton: true
			});
			if (canceled) return;
			this.value.type = type;
		},

		_getExpectedType(slot: number) {
			return this.aiScript.getExpectedType(this.value, slot);
		}
	}
});
</script>

<style lang="stylus" scoped>
.turmquns
	opacity 0.7

.pbglfege
	opacity 0.5
	padding 16px
	text-align center
	cursor pointer

.tbwccoaw
	> input
		display block
		-webkit-appearance none
		-moz-appearance none
		appearance none
		width 100%
		min-width 100%
		border none
		box-shadow none
		padding 16px
		font-size 16px

.hpdwcrvs
	padding 16px

	> select
		display block
		padding 4px
		font-size 16px
		width 100%

</style>
