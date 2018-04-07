<template>
<div class="sub" :title="title">
	<router-link class="avatar-anchor" :to="`/@${acct}`">
		<img class="avatar" :src="`${note.user.avatarUrl}?thumbnail&size=64`" alt="avatar" v-user-preview="note.userId"/>
	</router-link>
	<div class="main">
		<header>
			<router-link class="name" :to="`/@${acct}`" v-user-preview="note.userId">{{ name }}</router-link>
			<span class="username">@{{ acct }}</span>
			<router-link class="created-at" :to="`/@${acct}/${note.id}`">
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
		name(): string {
			return getUserName(this.note.user);
		},
		title(): string {
			return dateStringify(this.note.createdAt);
		}
	}
});
</script>

<style lang="stylus" scoped>
.sub
	margin 0
	padding 16px
	font-size 0.9em

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
		margin 0 14px 0 0

		> .avatar
			display block
			width 52px
			height 52px
			margin 0
			border-radius 8px
			vertical-align bottom

	> .main
		float left
		width calc(100% - 66px)

		> header
			display flex
			margin-bottom 2px
			white-space nowrap
			line-height 21px

			> .name
				display block
				margin 0 .5em 0 0
				padding 0
				overflow hidden
				color #607073
				font-size 1em
				font-weight bold
				text-decoration none
				text-overflow ellipsis

				&:hover
					text-decoration underline

			> .username
				margin 0 .5em 0 0
				color #d1d8da

			> .created-at
				margin-left auto
				color #b2b8bb

		> .body

			> .text
				cursor default
				margin 0
				padding 0
				font-size 1.1em
				color #717171

				pre
					max-height 120px
					font-size 80%

</style>
