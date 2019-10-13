<template>
<ui-container :body-togglable="true" :expanded="expanded">
	<template #header><slot></slot></template>

	<mk-error v-if="error" @retry="init()"/>

	<div class="efvhhmdq" :class="{ iconOnly }" v-size="[{ lt: 500, class: 'narrow' }]">
		<div class="no-users" v-if="empty">
			<p>{{ $t('no-users') }}</p>
		</div>
		<div class="user" v-for="user in users" :key="user.id">
			<mk-avatar class="avatar" :user="user"/>
			<div class="body" v-if="!iconOnly">
				<div class="name">
					<router-link class="name" :to="user | userPage" v-user-preview="user.id"><mk-user-name :user="user"/></router-link>
					<p class="username">@{{ user | acct }}</p>
				</div>
				<div class="description" v-if="user.description" :title="user.description">
					<mfm :text="user.description" :is-note="false" :author="user" :i="$store.state.i" :custom-emojis="user.emojis" :plain="true" :nowrap="true"/>
				</div>
				<mk-follow-button class="koudoku-button" v-if="$store.getters.isSignedIn && user.id != $store.state.i.id" :user="user" mini/>
			</div>
		</div>
		<button class="more" :class="{ fetching: moreFetching }" v-if="more" @click="fetchMore()" :disabled="moreFetching">
			<template v-if="moreFetching"><fa icon="spinner" pulse fixed-width/></template>{{ moreFetching ? $t('@.loading') : $t('@.load-more') }}
		</button>
	</div>
</ui-container>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import paging from '../../../common/scripts/paging';

export default Vue.extend({
	i18n: i18n('common/views/components/user-list.vue'),

	mixins: [
		paging({}),
	],

	props: {
		pagination: {
			required: true
		},
		extract: {
			required: false
		},
		iconOnly: {
			type: Boolean,
			default: false
		},
		expanded: {
			type: Boolean,
			default: true
		},
	},

	computed: {
		users() {
			return this.extract ? this.extract(this.items) : this.items;
		}
	}
});
</script>

<style lang="stylus" scoped>
.efvhhmdq
	&.narrow
		> .user > .body > .name
			width 100%

		> .user > .body > .description
			display none

	&.iconOnly
		padding 12px

		> .user
			display inline-block
			padding 0
			border-bottom none

			> .avatar
				display inline-block
				margin 4px

	> .no-users
		text-align center
		color var(--text)

	> .user
		display flex
		padding 16px
		border-bottom solid 1px var(--faceDivider)

		&:last-child
			border-bottom none

		> .avatar
			display block
			flex-shrink 0
			margin 0 12px 0 0
			width 42px
			height 42px
			border-radius 8px

		> .body
			display flex
			width calc(100% - 54px)

			> .name
				width 45%

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

			> .description
				width 55%
				color var(--text)
				line-height 42px
				white-space nowrap
				overflow hidden
				text-overflow ellipsis
				opacity 0.7
				font-size 14px
				padding-right 40px

			> .koudoku-button
				position absolute
				top 8px
				right 0

	> .more
		display block
		width 100%
		padding 16px
		color var(--text)
		border-top solid var(--lineWidth) rgba(#000, 0.05)

		&:hover
			background rgba(#000, 0.025)

		&:active
			background rgba(#000, 0.05)

		&.fetching
			cursor wait

		> [data-icon]
			margin-right 4px

</style>
