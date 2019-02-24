<template>
<mk-window ref="window" is-modal width="450px" height="500px" @closed="destroyDom">
	<template #header><fa :icon="['far', 'envelope']"/> {{ $t('title') }}</template>

	<div class="slpqaxdoxhvglersgjukmvizkqbmbokc">
		<div v-for="req in requests">
			<router-link :key="req.id" :to="req.follower | userPage">
				<mk-user-name :user="req.follower"/>
			</router-link>
			<span>
				<a @click="accept(req.follower)">{{ $t('accept') }}</a>|<a @click="reject(req.follower)">{{ $t('reject') }}</a>
			</span>
		</div>
	</div>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/components/received-follow-requests-window.vue'),
	data() {
		return {
			fetching: true,
			requests: []
		};
	},
	mounted() {
		this.$root.api('following/requests/list').then(requests => {
			this.fetching = false;
			this.requests = requests;
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
		},
		close() {
			(this as any).$refs.window.close();
		}
	}
});
</script>

<style lang="stylus" scoped>
.slpqaxdoxhvglersgjukmvizkqbmbokc
	padding 16px

	> button
		margin-bottom 16px

	> div
		display flex
		padding 16px
		border solid 1px var(--faceDivider)
		border-radius 4px

		> span
			margin 0 0 0 auto

</style>
