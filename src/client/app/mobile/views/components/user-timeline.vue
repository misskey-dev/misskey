<template>
<mk-notes ref="timeline" :pagination="pagination" @inited="() => $emit('loaded')"/>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('mobile/views/components/user-timeline.vue'),

	props: ['user', 'withMedia'],

	data() {
		return {
			date: null,
			pagination: {
				endpoint: 'users/notes',
				limit: 10,
				params: init => ({
					userId: this.user.id,
					withFiles: this.withMedia,
					untilDate: init ? undefined : (this.date ? this.date.getTime() : undefined),
				})
			}
		};
	},

	created() {
		this.$root.$on('warp', this.warp);
		this.$once('hook:beforeDestroy', () => {
			this.$root.$off('warp', this.warp);
		});
	},

	methods: {
		warp(date) {
			this.date = date;
			(this.$refs.timeline as unknown).reload();
		}
	}
});
</script>
