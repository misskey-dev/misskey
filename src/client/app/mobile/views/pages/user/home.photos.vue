<template>
<div class="root photos">
	<p class="initializing" v-if="fetching">%fa:spinner .pulse .fw%%i18n:mobile.tags.mk-user-overview-photos.loading%<mk-ellipsis/></p>
	<div class="stream" v-if="!fetching && images.length > 0">
		<a v-for="image in images"
			class="img"
			:style="`background-image: url(${image.media.url}?thumbnail&size=256)`"
			:href="`/@${getAcct(image.note.user)}/${image.note.id}`"
		></a>
	</div>
	<p class="empty" v-if="!fetching && images.length == 0">%i18n:mobile.tags.mk-user-overview-photos.no-photos%</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import getAcct from '../../../../../../acct/render';

export default Vue.extend({
	props: ['user'],
	data() {
		return {
			fetching: true,
			images: []
		};
	},
	methods: {
		getAcct
	},
	mounted() {
		(this as any).api('users/notes', {
			userId: this.user.id,
			withMedia: true,
			limit: 6
		}).then(notes => {
			notes.forEach(note => {
				note.media.forEach(media => {
					if (this.images.length < 9) this.images.push({
						note,
						media
					});
				});
			});
			this.fetching = false;
		});
	}
});
</script>

<style lang="stylus" scoped>
.root.photos

	> .stream
		display -webkit-flex
		display -moz-flex
		display -ms-flex
		display flex
		justify-content center
		flex-wrap wrap
		padding 8px

		> .img
			flex 1 1 33%
			width 33%
			height 80px
			background-position center center
			background-size cover
			background-clip content-box
			border solid 2px transparent
			border-radius 4px

	> .initializing
	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

		> i
			margin-right 4px

</style>

