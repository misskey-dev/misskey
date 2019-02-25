<template>
<x-column :name="name" :column="column" :is-stacked="isStacked">
	<template #header><fa icon="at"/>{{ name }}</template>

	<x-mentions ref="tl"/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XColumn from './deck.column.vue';
import XMentions from './deck.mentions.vue';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XColumn,
		XMentions
	},

	props: {
		column: {
			type: Object,
			required: true
		},
		isStacked: {
			type: Boolean,
			required: true
		}
	},

	computed: {
		name(): string {
			if (this.column.name) return this.column.name;
			return this.$t('@deck.mentions');
		}
	},

	methods: {
		focus() {
			this.$refs.tl.focus();
		}
	}
});
</script>
