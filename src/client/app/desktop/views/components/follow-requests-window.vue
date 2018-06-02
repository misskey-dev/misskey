<template>
<mk-window ref="window" is-modal width="450px" height="500px" @closed="$destroy">
	<span slot="header">%fa:envelope R% %i18n:@title%</span>

	<div data-id="c1136cec-1278-49b1-9ea7-412c1ef794f4" :data-darkmode="$store.state.device.darkmode">
		<div v-for="req in requests">
			<router-link :key="req.id" :to="req.follower | userPage">{{ req.follower | userName }}</router-link>
			<span>
				<a @click="accept(req.follower)">%i18n:@accept%</a>|<a @click="reject(req.follower)">%i18n:@reject%</a>
			</span>
		</div>
	</div>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	data() {
		return {
			fetching: true,
			requests: []
		};
	},
	mounted() {
		(this as any).api('following/requests/list').then(requests => {
			this.fetching = false;
			this.requests = requests;
		});
	},
	methods: {
		accept(user) {
			(this as any).api('following/requests/accept', { userId: user.id }).then(() => {
				this.requests = this.requests.filter(r => r.follower.id != user.id);
			});
		},
		reject(user) {
			(this as any).api('following/requests/reject', { userId: user.id }).then(() => {
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

root(isDark)
	padding 16px

	> button
		margin-bottom 16px

	> div
		display flex
		padding 16px
		border solid 1px isDark ? #1c2023 : #eee
		border-radius 4px

		> span
			margin 0 0 0 auto

[data-id="c1136cec-1278-49b1-9ea7-412c1ef794f4"][data-darkmode]
	root(true)

[data-id="c1136cec-1278-49b1-9ea7-412c1ef794f4"]:not([data-darkmode])
	root(false)

</style>
