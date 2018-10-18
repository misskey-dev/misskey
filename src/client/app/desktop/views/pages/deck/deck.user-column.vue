<template>
<x-column :name="name" :is-stacked="false">
	<span slot="header">
		%fa:user%<span>{{ name }}</span>
	</span>

	<p>test</p>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XTl from './deck.tl.vue';
import XListTl from './deck.list-tl.vue';
import XHashtagTl from './deck.hashtag-tl.vue';

export default Vue.extend({
	components: {
		XColumn
	},

	props: {
		user: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			name: 'a'
		};
	}
});
</script>
