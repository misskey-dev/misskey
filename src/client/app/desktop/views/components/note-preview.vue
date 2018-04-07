<template>
<div class="mk-note-preview" :title="title">
	<router-link class="avatar-anchor" :to="`/@${acct}`">
		<img class="avatar" :src="`${note.user.avatarUrl}?thumbnail&size=64`" alt="avatar" v-user-preview="note.userId"/>
	</router-link>
	<div class="main">
		<header>
			<router-link class="name" :to="`/@${acct}`" v-user-preview="note.userId">{{ name }}</router-link>
			<span class="username">@{{ acct }}</span>
			<router-link class="time" :to="`/@${acct}/${note.id}`">
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
import dateStringify from '../../../common/scripts/date-stringify';
import getAcct from '../../../../../acct/render';
import getUserName from '../../../../../renderers/get-user-name';

export default Vue.extend({
	props: ['note'],
	computed: {
		acct() {
			return getAcct(this.note.user);
		},
		name() {
			return getUserName(this.note.user);
		},
		title(): string {
			return dateStringify(this.note.createdAt);
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-note-preview
	font-size 0.9em
	background #fff

	&:after
		content ""
		display block
		clear both

	&:hover
		> .main > footer > button
			color #888

	> .avatar-anchor
		display block
		float left
		margin 0 16px 0 0

		> .avatar
			display block
			width 52px
			height 52px
			margin 0
			border-radius 8px
			vertical-align bottom

	> .main
		float left
		width calc(100% - 68px)

		> header
			display flex
			white-space nowrap

			> .name
				margin 0 .5em 0 0
				padding 0
				color #607073
				font-size 1em
				font-weight bold
				text-decoration none
				white-space normal

				&:hover
					text-decoration underline

			> .username
				margin 0 .5em 0 0
				color #d1d8da

			> .time
				margin-left auto
				color #b2b8bb

		> .body

			> .text
				cursor default
				margin 0
				padding 0
				font-size 1.1em
				color #717171

</style>
