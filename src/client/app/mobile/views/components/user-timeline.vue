<template>
<div class="mk-user-timeline">
	<mk-notes ref="timeline" :more="existMore ? more : null">
		<div slot="empty">
			<fa :icon="['far', 'comments']"/>
			{{ withMedia ? this.$t('no-notes-with-media') : this.$t('no-notes') }}
		</div>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

const fetchLimit = 10;

export default Vue.extend({
	i18n: i18n('mobile/views/components/user-timeline.vue'),
	props: ['user', 'withMedia'],

	data() {
		return {
			fetching: true,
			existMore: false,
			moreFetching: false
		};
	},

	computed: {
		canFetchMore(): boolean {
			return !this.moreFetching && !this.fetching && this.existMore;
		}
	},

	mounted() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.fetching = true;
			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				this.$root.api('users/notes', {
					userId: this.user.id,
					withFiles: this.withMedia,
					limit: fetchLimit + 1
				}).then(notes => {
					if (notes.length == fetchLimit + 1) {
						notes.pop();
						this.existMore = true;
					}
					res(notes);
					this.fetching = false;
					this.$emit('loaded');
				}, rej);
			}));
		},

		more() {
			if (!this.canFetchMore) return;

			this.moreFetching = true;

			const promise = this.$root.api('users/notes', {
				userId: this.user.id,
				withFiles: this.withMedia,
				limit: fetchLimit + 1,
				untilId: (this.$refs.timeline as any).tail().id
			});

			promise.then(notes => {
				if (notes.length == fetchLimit + 1) {
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
