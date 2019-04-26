<template>
<x-container :removable="removable">
	<template #header><fa :icon="icon"/> <template v-if="title">{{ title }} <span class="turmquns">({{ typeText }})</span></template><template v-else>{{ typeText }}</template></template>
	<template #func>
		<button @click="changeType()">
			<fa :icon="faPencilAlt"/>
		</button>
	</template>

	<section v-if="value.type === 'formula'" class="tbwccoaw">
		<input v-model="value.value"/>
	</section>
	<section v-if="value.type === 'text'" class="tbwccoaw">
		<input v-model="value.value"/>
	</section>
	<section v-if="value.type === 'multiLineText'" class="tbwccoaw">
		<textarea v-model="value.value"></textarea>
	</section>
	<section v-else-if="value.type === 'if'" class="" style="padding:16px;">
		<x-v v-model="value.x" title="もし"/>
		<x-v v-model="value.a" title="ならば"/>
		<x-v v-model="value.b" title="そうでなければ"/>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import XContainer from './page-editor.container.vue';
import { faSuperscript, faPencilAlt, faAlignLeft, faCodeBranch, faSquareRootAlt, faQuoteRight } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/page-editor.text.vue'),

	components: {
		XContainer
	},

	props: {
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
	},

	data() {
		return {
			faSuperscript, faPencilAlt, faCodeBranch, faSquareRootAlt
		};
	},

	computed: {
		icon(): any {
			if (this.value.type === 'formula') return faSuperscript;
			if (this.value.type === 'if') return faCodeBranch;
			if (this.value.type === 'text') return faQuoteRight;
			if (this.value.type === 'multiLineText') return faAlignLeft;
		},
		typeText(): any {
			if (this.value.type === 'formula') return '式';
			if (this.value.type === 'if') return 'IF';
			if (this.value.type === 'text') return 'テキスト';
			if (this.value.type === 'multiLineText') return 'テキスト(複数行)';
		},
	},

	beforeCreate() {
		this.$options.components.XV = require('./page-editor.variable.core.vue').default;
	},

	created() {
		if (this.value.value == null) Vue.set(this.value, 'value', '');
		if (this.value.x == null) Vue.set(this.value, 'x', { type: 'formula' });
		if (this.value.a == null) Vue.set(this.value, 'a', { type: 'formula' });
		if (this.value.b == null) Vue.set(this.value, 'b', { type: 'formula' });
	},

	methods: {
		async changeType() {
			const { canceled, result: type } = await this.$root.dialog({
				type: null,
				title: 'Select type',
				select: {
					items: [{
						value: 'if', text: 'IF'
					}, {
						value: 'text', text: 'Text'
					}, {
						value: 'multiLineText', text: 'Text(複数行)'
					}, {
						value: 'list', text: 'List'
					}, {
						value: 'formula', text: 'Expression'
					}]
				},
				showCancelButton: true
			});
			if (canceled) return;
			this.value.type = type;
		}
	}
});
</script>

<style lang="stylus" scoped>
.turmquns
	opacity 0.7

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
</style>
