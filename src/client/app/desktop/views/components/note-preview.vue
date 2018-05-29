<template>
<div class="mk-note-preview" :title="title">
	<mk-avatar class="avatar" :user="note.user"/>
	<div class="main">
		<header>
			<router-link class="name" :to="note.user | userPage" v-user-preview="note.userId">{{ note.user | userName }}</router-link>
			<span class="username"><mk-acct :user="note.user"/></span>
			<div class="info">
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
		<div class="body">
			<mk-sub-note-content class="text" :note="note"/>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import dateStringify from '../../../common/scripts/date-stringify';

export default Vue.extend({
	props: ['note'],
	computed: {
		title(): string {
			return dateStringify(this.note.createdAt);
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	display flex
	font-size 0.9em

	> .avatar
		flex-shrink 0
		display block
		margin 0 12px 0 0
		width 48px
		height 48px
		border-radius 8px

	> .main
		flex 1
		min-width 0

		> header
			display flex
			align-items baseline
			white-space nowrap

			> .name
				margin 0 .5em 0 0
				padding 0
				overflow hidden
				color isDark ? #fff : #607073
				font-size 1em
				font-weight bold
				text-decoration none
				text-overflow ellipsis

				&:hover
					text-decoration underline

			> .username
				margin 0 .5em 0 0
				overflow hidden
				text-overflow ellipsis
				color isDark ? #606984 : #d1d8da

			> .info
				margin-left auto
				font-size 0.9em

				> *
					color isDark ? #606984 : #b2b8bb

				> .mobile
					margin-right 6px

				> .visibility
					margin-left 6px

		> .body

			> .text
				cursor default
				margin 0
				padding 0
				color isDark ? #959ba7 : #717171

.mk-note-preview[data-darkmode]
	root(true)

.mk-note-preview:not([data-darkmode])
	root(false)

</style>
