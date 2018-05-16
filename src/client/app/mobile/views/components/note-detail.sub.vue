<template>
<div class="root sub">
	<mk-avatar class="avatar" :user="note.user"/>
	<div class="main">
		<header>
			<router-link class="name" :to="note.user | userPage">{{ note.user | userName }}</router-link>
			<span class="username">@{{ note.user | acct }}</span>
			<router-link class="time" :to="note | notePage">
				<mk-time :time="note.createdAt"/>
			</router-link>
		</header>
		<div class="body">
			<mk-sub-note-content class="text" :note="note"/>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['note']
});
</script>

<style lang="stylus" scoped>
root(isDark)
	padding 8px
	font-size 0.9em
	background isDark ? #21242d : #fdfdfd

	@media (min-width 500px)
		padding 12px

	@media (min-width 600px)
		padding 24px 32px

	&:after
		content ""
		display block
		clear both

	> .avatar
		display block
		float left
		margin 0 12px 0 0
		width 48px
		height 48px
		border-radius 8px

	> .main
		float left
		width calc(100% - 60px)

		> header
			display flex
			align-items baseline
			margin-bottom 4px
			white-space nowrap

			> .name
				display block
				margin 0 .5em 0 0
				padding 0
				overflow hidden
				color isDark ? #fff : #607073
				font-size 1em
				font-weight 700
				text-align left
				text-decoration none
				text-overflow ellipsis

				&:hover
					text-decoration underline

			> .username
				text-align left
				margin 0 .5em 0 0
				color isDark ? #606984 : #d1d8da

			> .time
				margin-left auto
				color isDark ? #606984 : #b2b8bb

		> .body

			> .text
				cursor default
				margin 0
				padding 0
				font-size 1.1em
				color isDark ? #959ba7 : #717171

.root.sub[data-darkmode]
	root(true)

.root.sub:not([data-darkmode])
	root(false)

</style>
