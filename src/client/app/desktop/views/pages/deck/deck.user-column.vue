<template>
<x-column :is-stacked="false">
	<span slot="header">
		%fa:user%<span>{{ title }}</span>
	</span>

	<p>test</p>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import parseAcct from '../../../../../../misc/acct/parse';
import XColumn from './deck.column.vue';
import XTl from './deck.tl.vue';
import XListTl from './deck.list-tl.vue';
import XHashtagTl from './deck.hashtag-tl.vue';

export default Vue.extend({
	components: {
		XColumn
	},

	props: {
		acct: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			user: null,
			fetching: true
		};
	},

	computed: {
		title(): string {
			return this.user ? this.user.name || this.user.username : '';
		}
	},

	created() {
		(this as any).api('users/show', parseAcct(this.acct)).then(user => {
			this.user = user;
			this.fetching = false;
		});
	}
});
</script>
