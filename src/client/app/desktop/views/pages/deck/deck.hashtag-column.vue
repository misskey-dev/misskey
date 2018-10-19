<template>
<x-column>
	<span slot="header">
		%fa:hashtag%<span>{{ tag }}</span>
	</span>

	<x-hashtag-tl :tag-tl="tagTl"/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XHashtagTl from './deck.hashtag-tl.vue';

export default Vue.extend({
	components: {
		XColumn,
		XHashtagTl
	},

	props: {
		tag: {
			type: String,
			required: true
		}
	},

	computed: {
		tagTl(): any {
			return {
				query: [[this.tag]]
			};
		}
	}
});
</script>
