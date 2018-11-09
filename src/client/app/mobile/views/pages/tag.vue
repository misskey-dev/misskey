<template>
<mk-ui>
	<span slot="header"><span style="margin-right:4px;"><fa icon="hashtag"/></span>{{ $route.params.tag }}</span>

	<main>
		<p v-if="!fetching && empty"><fa icon="search"/> {{ $t('no-posts-found', { q }) }}</p>
		<mk-notes ref="timeline" :more="existMore ? more : null"/>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';

const limit = 20;

export default Vue.extend({
	i18n: i18n('mobile/views/pages/tag.vue'),
	data() {
		return {
			fetching: true,
			moreFetching: false,
			existMore: false,
			offset: 0,
			empty: false
		};
	},
	watch: {
		$route: 'fetch'
	},
	mounted() {
		this.$nextTick(() => {
			this.fetch();
		});
	},
	methods: {
		fetch() {
			this.fetching = true;
			Progress.start();

			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				this.$root.api('notes/search_by_tag', {
					limit: limit + 1,
					offset: this.offset,
					tag: this.$route.params.tag
				}).then(notes => {
					if (notes.length == 0) this.empty = true;
					if (notes.length == limit + 1) {
						notes.pop();
						this.existMore = true;
					}
					res(notes);
					this.fetching = false;
					Progress.done();
				}, rej);
			}));
		},
		more() {
			this.offset += limit;

			const promise = this.$root.api('notes/search_by_tag', {
				limit: limit + 1,
				offset: this.offset,
				tag: this.$route.params.tag
			});

			promise.then(notes => {
				if (notes.length == limit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				notes.forEach(n => (this.$refs.timeline as any).append(n));
				this.moreFetching = false;
			});

			return promise;
		}
	}
});
</script>
