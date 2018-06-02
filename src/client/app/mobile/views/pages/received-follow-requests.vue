<template>
<mk-ui>
	<span slot="header">%fa:envelope R%%i18n:@title%</span>

	<main>
		<div v-for="req in requests">
			<router-link :key="req.id" :to="req.follower | userPage">{{ req.follower | userName }}</router-link>
			<span>
				<a @click="accept(req.follower)">%i18n:@accept%</a>|<a @click="reject(req.follower)">%i18n:@reject%</a>
			</span>
		</div>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	data() {
		return {
			fetching: true,
			requests: []
		};
	},
	mounted() {
		document.title = 'Misskey | %i18n:@title%';

		Progress.start();

		(this as any).api('following/requests/list').then(requests => {
			this.fetching = false;
			this.requests = requests;

			Progress.done();
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
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

main
	width 100%
	max-width 680px
	margin 0 auto
	padding 8px

	@media (min-width 500px)
		padding 16px

	@media (min-width 600px)
		padding 32px

	> div
		display flex
		padding 16px
		border solid 1px isDark ? #1c2023 : #eee
		border-radius 4px

		> span
			margin 0 0 0 auto

</style>
