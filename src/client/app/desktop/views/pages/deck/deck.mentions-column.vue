<template>
<x-column :name="name" :column="column" :is-stacked="isStacked">
	<span slot="header">%fa:at%{{ name }}</span>

	<x-mentions ref="tl"/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XMentions from './deck.mentions.vue';

export default Vue.extend({
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
			return '%i18n:common.deck.mentions%';
		}
	},

	methods: {
		focus() {
			this.$refs.tl.focus();
		}
	}
});
</script>
