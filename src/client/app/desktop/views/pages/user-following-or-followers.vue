<template>
<mk-ui>
	<div class="yyyocnobkvdlnyapyauyopbskldsnipz" v-if="!fetching">
		<div class="users">
			<mk-user-card v-for="user in users" :user="user" :key="user.id"/>
		</div>
		<div class="more">
			<ui-button inline @click="fetchMore">%i18n:@load-more%</ui-button>
		</div>
	</div>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import parseAcct from '../../../../../misc/acct/parse';
import Progress from '../../../common/scripts/loading';

const limit = 16;

export default Vue.extend({
	data() {
		return {
			fetching: true,
			user: null,
			users: [],
			cursor: undefined
		};
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
			Progress.start();
			(this as any).api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				(this as any).api('users/following', {
					userId: this.user.id,
					iknow: false,
					limit: limit
				}).then(x => {
					this.users = x.users;
					this.fetching = false;
					Progress.done();
				});
			});
		},

		fetchMore() {
			(this as any).api('users/following', {
				userId: this.user.id,
				iknow: false,
				limit: limit,
				cursor: this.cursor
			}).then(x => {
				this.users = this.users.concat(x.users);
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.yyyocnobkvdlnyapyauyopbskldsnipz
	width 100%
	max-width 1280px
	padding 16px
	margin 0 auto

	> .users
		display grid
		grid-template-columns 1fr 1fr 1fr 1fr
		gap 16px

	> .more
		margin 32px 16px 16px 16px
		text-align center

</style>
