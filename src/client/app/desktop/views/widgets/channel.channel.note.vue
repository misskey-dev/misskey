<template>
<div class="note">
	<header>
		<a class="index" @click="reply">{{ note.index }}:</a>
		<router-link class="name" :to="`/@${acct}`" v-user-preview="note.user.id"><b>{{ name }}</b></router-link>
		<span>ID:<i>{{ acct }}</i></span>
	</header>
	<div>
		<a v-if="note.reply">&gt;&gt;{{ note.reply.index }}</a>
		{{ note.text }}
		<div class="media" v-if="note.media">
			<a v-for="file in note.media" :href="file.url" target="_blank">
				<img :src="`${file.url}?thumbnail&size=512`" :alt="file.name" :title="file.name"/>
			</a>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
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
		}
	},
	methods: {
		reply() {
			this.$emit('reply', this.note);
		}
	}
});
</script>

<style lang="stylus" scoped>
.note
	margin 0
	padding 0
	color #444

	> header
		position -webkit-sticky
		position sticky
		z-index 1
		top 0
		padding 8px 4px 4px 16px
		background rgba(255, 255, 255, 0.9)

		> .index
			margin-right 0.25em

		> .name
			margin-right 0.5em
			color #008000

	> div
		padding 0 16px 16px 16px

		> .media
			> a
				display inline-block

				> img
					max-width 100%
					vertical-align bottom

</style>
