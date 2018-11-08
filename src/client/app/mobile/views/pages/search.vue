<template>
<mk-ui>
	<span slot="header"><fa icon="search"/> {{ q }}</span>

	<main>
		<p :class="$style.empty" v-if="!fetching && empty"><fa icon="search"/> {{ $t('not-found', { q }) }}</p>
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
	i18n: i18n('mobile/views/pages/search.vue'),
	data() {
		return {
			fetching: true,
			moreFetching: false,
			existMore: false,
			empty: false,
			offset: 0
		};
	},
	watch: {
		$route: 'fetch'
	},
	computed: {
		q(): string {
			return this.$route.query.q;
		}
	},
	mounted() {
		document.title = `%i18n:@search%: ${this.q} | ${this.$root.instanceName}`;

		this.fetch();
	},
	methods: {
		fetch() {
			this.fetching = true;
			Progress.start();

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
					Progress.done();
				}, rej);
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
				notes.forEach(n => (this.$refs.timeline as any).append(n));
				this.moreFetching = false;
			});

			return promise;
		}
	}
});
</script>

<style lang="stylus" module>
.notes
	margin 8px auto
	max-width 500px
	width calc(100% - 16px)
	background #fff
	border-radius 8px
	box-shadow 0 0 0 1px rgba(#000, 0.2)

	@media (min-width 500px)
		margin 16px auto
		width calc(100% - 32px)
</style>
