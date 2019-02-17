<template>
<x-column>
	<span slot="header">
		<fa icon="search"/><span>{{ q }}</span>
	</span>

	<div>
		<x-notes ref="timeline" :more="existMore ? more : null"/>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XNotes from './deck.notes.vue';

const limit = 20;

export default Vue.extend({
	components: {
		XColumn,
		XNotes
	},

	data() {
		return {
			fetching: true,
			moreFetching: false,
			existMore: false,
			offset: 0,
			empty: false,
			notAvailable: false
		};
	},

	computed: {
		q(): string {
			return this.$route.query.q;
		}
	},

	watch: {
		$route: 'fetch'
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.fetching = true;

			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				this.$root.api('notes/search', {
					limit: limit + 1,
					offset: this.offset,
					query: this.q
				}).then(notes => {
					if (notes.length == 0) this.empty = true;
					if (notes.length == limit + 1) {
						notes.pop();
						this.existMore = true;
					}
					res(notes);
					this.fetching = false;
				}, (e: string) => {
					this.fetching = false;
					if (e === 'searching not available') this.notAvailable = true;
				});
			}));
		},
		more() {
			this.offset += limit;

			const promise = this.$root.api('notes/search', {
				limit: limit + 1,
				offset: this.offset,
				query: this.q
			});

			promise.then(notes => {
				if (notes.length == limit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				for (const n of notes) {
					(this.$refs.timeline as any).append(n);
				}
				this.moreFetching = false;
			});

			return promise;
		}
	}
});
</script>
