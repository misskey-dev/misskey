<template>
<ui-container :body-togglable="true">
	<template slot="header"><slot></slot></template>
	<div class="efvhhmdq" v-size="[{ lt: 500, class: 'narrow' }]">
		<div class="user" v-for="user in users">
			<mk-avatar class="avatar" :user="user"/>
			<div class="body">
				<div class="name">
					<router-link class="name" :to="user | userPage" v-user-preview="user.id"><mk-user-name :user="user"/></router-link>
					<p class="username">@{{ user | acct }}</p>
				</div>
				<div class="description" v-if="user.description">
					<mfm :text="user.description" :author="user" :i="$store.state.i" :custom-emojis="user.emojis" :should-break="false"/>
				</div>
			</div>
		</div>
	</div>
</ui-container>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		users: {
			type: Array,
			required: true
		},
		iconOnly: {
			type: Boolean,
			default: false
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

</style>
