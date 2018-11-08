<template>
<mk-ui>
	<div class="yyyocnobkvdlnyapyauyopbskldsnipz" v-if="!fetching">
		<header>
			<mk-avatar class="avatar" :user="user"/>
			<i18n :path="isFollowing ? 'following' : 'followers'" tag="p">
				<router-link :to="user | userPage" place="user">{{ user | userName }}</router-link>
			</i18n>
		</header>
		<div class="users">
			<mk-user-card v-for="user in users" :user="user" :key="user.id"/>
		</div>
		<div class="more" v-if="next">
			<ui-button inline @click="fetchMore">%i18n:@load-more%</ui-button>
		</div>
	</div>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import parseAcct from '../../../../../misc/acct/parse';
import Progress from '../../../common/scripts/loading';
import { lang, locale } from '../../../config';

const limit = 16;

const i18n = new VueI18n({
	locale: lang,
	messages: {
		[lang]: locale['desktop/views/pages/user-following-or-followers.vue']
	}
});

export default Vue.extend({
	i18n,

	data() {
		return {
			fetching: true,
			user: null,
			users: [],
			next: undefined
		};
	},
	computed: {
		isFollowing(): boolean {
			return this.$route.name == 'userFollowing';
		},
		endpoint(): string {
			return this.isFollowing ? 'users/following' : 'users/followers';
		}
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
				(this as any).api(this.endpoint, {
					userId: this.user.id,
					iknow: false,
					limit: limit
				}).then(x => {
					this.users = x.users;
					this.next = x.next;
					this.fetching = false;
					Progress.done();
				});
			});
		},

		fetchMore() {
			(this as any).api(this.endpoint, {
				userId: this.user.id,
				iknow: false,
				limit: limit,
				cursor: this.next
			}).then(x => {
				this.users = this.users.concat(x.users);
				this.next = x.next;
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

	> header
		display flex
		align-items center
		margin 0 0 16px 0
		color var(--text)

		> .avatar
			width 64px
			height 64px

		> p
			margin 0 16px
			font-size 24px
			font-weight bold

	> .users
		display grid
		grid-template-columns 1fr 1fr 1fr 1fr
		gap 16px

	> .more
		margin 32px 16px 16px 16px
		text-align center

</style>
