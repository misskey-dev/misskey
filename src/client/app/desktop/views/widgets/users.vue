<template>
<div class="mkw-users">
	<ui-container :show-header="!props.compact">
		<template #header><fa icon="users"/>{{ $t('title') }}</template>
		<template #func>
			<button :title="$t('title')" @click="refresh">
				<fa v-if="!fetching && more" icon="arrow-right"/>
				<fa v-if="!fetching && !more" icon="sync"/>
			</button>
		</template>

		<div class="mkw-users--body">
			<p class="fetching" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('@.loading') }}<mk-ellipsis/></p>
			<template v-else-if="users.length != 0">
				<div class="user" v-for="_user in users">
					<mk-avatar class="avatar" :user="_user"/>
					<div class="body">
						<router-link class="name" :to="_user | userPage" v-user-preview="_user.id"><mk-user-name :user="_user"/></router-link>
						<p class="username">@{{ _user | acct }}</p>
					</div>
				</div>
			</template>
			<p class="empty" v-else>{{ $t('no-one') }}</p>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';

const limit = 3;

export default define({
	name: 'users',
	props: () => ({
		compact: false
	})
}).extend({
	i18n: i18n('desktop/views/widgets/users.vue'),
	data() {
		return {
			users: [],
			fetching: true,
			more: true,
			page: 0
		};
	},
	mounted() {
		this.fetch();
	},
	methods: {
		func() {
			this.props.compact = !this.props.compact;
			this.save();
		},
		fetch() {
			this.fetching = true;
			this.users = [];

			this.$root.api('users/recommendation', {
				limit: limit,
				offset: limit * this.page
			}).then(users => {
				this.users = users;
				this.fetching = false;
			}).catch(() => {
				this.users = [];
				this.fetching = false;
				this.more = false;
				this.page = 0;
			});
		},
		refresh() {
			if (this.users.length < limit) {
				this.more = false;
				this.page = 0;
			} else {
				this.more = true;
				this.page++;
			}
			this.fetch();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-users
	.mkw-users--body
		> .user
			padding 16px
			border-bottom solid 1px var(--faceDivider)

			&:last-child
				border-bottom none

			&:after
				content ""
				display block
				clear both

			> .avatar
				display block
				float left
				margin 0 12px 0 0
				width 42px
				height 42px
				border-radius 8px

			> .body
				float left
				width calc(100% - 54px)

				> .name
					margin 0
					font-size 16px
					line-height 24px
					color var(--text)

				> .username
					display block
					margin 0
					font-size 15px
					line-height 16px
					color var(--text)
					opacity 0.7

		> .empty
			margin 0
			padding 16px
			text-align center
			color var(--text)

		> .fetching
			margin 0
			padding 16px
			text-align center
			color var(--text)

			> [data-icon]
				margin-right 4px

</style>
