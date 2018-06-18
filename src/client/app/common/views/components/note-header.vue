<template>
<header class="bvonvjxbwzaiskogyhbwgyxvcgserpmu">
	<mk-avatar class="avatar" :user="note.user" v-if="$store.state.device.postStyle == 'smart'"/>
	<router-link class="name" :to="note.user | userPage" v-user-preview="note.user.id">{{ note.user | userName }}</router-link>
	<span class="is-admin" v-if="note.user.isAdmin">admin</span>
	<span class="is-bot" v-if="note.user.isBot">bot</span>
	<span class="is-cat" v-if="note.user.isCat">cat</span>
	<span class="username"><mk-acct :user="note.user"/></span>
	<div class="info">
		<span class="app" v-if="note.app && !mini">via <b>{{ note.app.name }}</b></span>
		<span class="mobile" v-if="note.viaMobile">%fa:mobile-alt%</span>
		<router-link class="created-at" :to="note | notePage">
			<mk-time :time="note.createdAt"/>
		</router-link>
		<span class="visibility" v-if="note.visibility != 'public'">
			<template v-if="note.visibility == 'home'">%fa:home%</template>
			<template v-if="note.visibility == 'followers'">%fa:unlock%</template>
			<template v-if="note.visibility == 'specified'">%fa:envelope%</template>
			<template v-if="note.visibility == 'private'">%fa:lock%</template>
		</span>
	</div>
</header>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		note: {
			type: Object,
			required: true
		},
		mini: {
			type: Boolean,
			required: false,
			default: false
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	display flex
	align-items baseline
	white-space nowrap

	> .avatar
		flex-shrink 0
		margin-right 8px
		width 20px
		height 20px
		border-radius 100%

	> .name
		display block
		margin 0 .5em 0 0
		padding 0
		overflow hidden
		color isDark ? #fff : #627079
		font-size 1em
		font-weight bold
		text-decoration none
		text-overflow ellipsis

		&:hover
			text-decoration underline

	> .is-admin
	> .is-bot
	> .is-cat
		align-self center
		margin 0 .5em 0 0
		padding 1px 6px
		font-size 80%
		color isDark ? #758188 : #aaa
		border solid 1px isDark ? #57616f : #ddd
		border-radius 3px

		&.is-admin
			border-color isDark ? #d42c41 : #f56a7b
			color isDark ? #d42c41 : #f56a7b

	> .username
		margin 0 .5em 0 0
		overflow hidden
		text-overflow ellipsis
		color isDark ? #606984 : #ccc

	> .info
		margin-left auto
		font-size 0.9em

		> *
			color isDark ? #606984 : #c0c0c0

		> .mobile
			margin-right 8px

		> .app
			margin-right 8px
			padding-right 8px
			border-right solid 1px isDark ? #1c2023 : #eaeaea

		> .visibility
			margin-left 8px

.bvonvjxbwzaiskogyhbwgyxvcgserpmu[data-darkmode]
	root(true)

.bvonvjxbwzaiskogyhbwgyxvcgserpmu:not([data-darkmode])
	root(false)

</style>
