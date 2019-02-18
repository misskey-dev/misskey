<template>
<mk-ui>
	<template #header><fa :icon="['far', 'envelope']"/>{{ $t('title') }}</template>

	<main>
		<div v-for="req in requests">
			<router-link :key="req.id" :to="req.follower | userPage">
				<mk-user-name :user="req.follower"/>
			</router-link>
			<span>
				<a @click="accept(req.follower)">{{ $t('accept') }}</a>|<a @click="reject(req.follower)">{{ $t('reject') }}</a>
			</span>
		</div>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/received-follow-requests.vue'),
	data() {
		return {
			fetching: true,
			requests: []
		};
	},
	mounted() {
		document.title = this.$t('title');

		Progress.start();

		this.$root.api('following/requests/list').then(requests => {
			this.fetching = false;
			this.requests = requests;

			Progress.done();
		});
	},
	methods: {
		accept(user) {
			this.$root.api('following/requests/accept', { userId: user.id }).then(() => {
				this.requests = this.requests.filter(r => r.follower.id != user.id);
			});
		},
		reject(user) {
			this.$root.api('following/requests/reject', { userId: user.id }).then(() => {
				this.requests = this.requests.filter(r => r.follower.id != user.id);
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
main
	> div
		display flex
		padding 16px
		border solid 1px var(--faceDivider)
		border-radius 4px

		> span
			margin 0 0 0 auto

</style>
