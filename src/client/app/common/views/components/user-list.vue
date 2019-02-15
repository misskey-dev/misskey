<template>
<ui-container :body-togglable="true">
	<template slot="header"><slot></slot></template>
	<div class="efvhhmdq">
		<div class="user" v-for="friend in users">
			<mk-avatar class="avatar" :user="friend"/>
			<div class="body">
				<router-link class="name" :to="friend | userPage" v-user-preview="friend.id"><mk-user-name :user="friend"/></router-link>
				<p class="username">@{{ friend | acct }}</p>
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

</style>
