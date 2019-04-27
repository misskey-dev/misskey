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
	<section v-else-if="value.type === 'expression'" class="tbwccoaw">
		<input v-model="value.value"/>
	</section>
	<section v-else-if="value.type === 'text'" class="tbwccoaw">
		<input v-model="value.value"/>
	</section>
	<section v-else-if="value.type === 'multiLineText'" class="tbwccoaw">
		<textarea v-model="value.value"></textarea>
	</section>
	<section v-else-if="value.type === 'number'" class="tbwccoaw">
		<input v-model="value.value" type="number"/>
	</section>
	<section v-else-if="value.type === 'ref'" class="hpdwcrvs">
		<select v-model="value.value">
			<option v-for="v in aiScript.getVariablesByType(getExpectedType ? getExpectedType() : null)" :value="v.id">{{ v.name }}</option>
			<optgroup :label="$t('script.enviromentVariables')">
				<option v-for="v in aiScript.getEnvVariablesByType(getExpectedType ? getExpectedType() : null)" :value="v">{{ v }}</option>
			</optgroup>
		</select>
	</section>
	<section v-else class="" style="padding:16px;">
		<x-v v-for="(x, i) in AiScript.funcDefs[value.type].in" v-model="value.args[i]" :title="$t(`script.blocks._${value.type}.arg${i + 1}`)" :get-expected-type="() => _getExpectedType(i)" :ai-script="aiScript" :key="i"/>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import XContainer from './page-editor.container.vue';
import {
	faSuperscript,
	faPencilAlt,
	faSquareRootAlt,
} from '@fortawesome/free-solid-svg-icons';
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
		}
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
		this.$options.components.XV = require('./page-editor.variable.core.vue').default;
	},

	created() {
		if (this.value.value == null) Vue.set(this.value, 'value', '');
		if (this.value.args == null) Vue.set(this.value, 'args', [{ type: null }, { type: null }, { type: null }]);

		this.$watch('value.type', (t) => {
			if (t === null) return;
			if (t === 'expression') return;
			if (t === 'number') return;
			if (t === 'text') return;
			if (t === 'multiLineText') return;
			if (t === 'ref') return;

			for (let i = 0; i < AiScript.funcDefs[t].in.length; i++) {
				const inType = AiScript.funcDefs[t].in[i];
				if (typeof inType !== 'number') {
					if (inType === 'number') this.value.args[i].type = 'number';
					if (inType === 'string') this.value.args[i].type = 'text';
				}
			}
		});

		this.$watch('value.args', (args) => {
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
/*
		this.$watch('value', (v) => {
			this.error = typeCheck(v);
		}, {
			deep: true
		});
*/
		this.$watch('aiScript.variables', () => {
			this.error = this.aiScript.typeCheck(this.value);
		}, {
			deep: true
		});
	},

	methods: {
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
