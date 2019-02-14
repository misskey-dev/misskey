<template>
<x-column>
	<span slot="header">
		<fa :icon="['fa', 'star']"/>{{ $t('favorites') }}
	</span>

	<div>
		<x-notes ref="timeline" :more="existMore ? more : null"/>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XColumn from './deck.column.vue';
import XNotes from './deck.notes.vue';

const fetchLimit = 10;

export default Vue.extend({
	i18n: i18n(),

	components: {
		XColumn,
		XNotes,
	},

	data() {
		return {
			fetching: true,
			moreFetching: false,
			existMore: false,
		};
	},

	mounted() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.fetching = true;

			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				this.$root.api('i/favorites', {
					limit: fetchLimit + 1,
				}).then(notes => {
					if (notes.length == fetchLimit + 1) {
						notes.pop();
						this.existMore = true;
					}
					res(notes.map(x => x.note));
					this.fetching = false;
					this.$emit('loaded');
				}, rej);
			}));
		},

		more() {
			this.moreFetching = true;

			const promise = this.$root.api('i/favorites', {
				limit: fetchLimit + 1,
				untilId: (this.$refs.timeline as any).tail().id,
			});

			promise.then(notes => {
				if (notes.length == fetchLimit + 1) {
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
		},

		focus() {
			this.$refs.timeline.focus();
		}
	}
});
</script>
