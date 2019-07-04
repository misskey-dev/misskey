<template>
<div class="root photos">
	<p class="initializing" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('@.loading') }}<mk-ellipsis/></p>
	<div class="stream" v-if="!fetching && images.length > 0">
		<a v-for="(image, i) in images" :key="i"
			class="img"
			:style="`background-image: url(${thumbnail(image.file)})`"
			:href="image.note | notePage"
		></a>
	</div>
	<p class="empty" v-if="!fetching && images.length == 0">{{ $t('no-photos') }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { getStaticImageUrl } from '../../../../common/scripts/get-static-image-url';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/user/home.photos.vue'),
	props: ['user'],
	data() {
		return {
			fetching: true,
			images: []
		};
	},
	mounted() {
		const image = [
			'image/jpeg',
			'image/png',
			'image/gif',
			'image/apng',
			'image/vnd.mozilla.apng',
		];
		this.$root.api('users/notes', {
			userId: this.user.id,
			fileType: image,
			excludeNsfw: !this.$store.state.device.alwaysShowNsfw,
			limit: 9,
		}).then(notes => {
			for (const note of notes) {
				for (const file of note.files) {
					if (this.images.length < 9) {
						this.images.push({
							note,
							file
						});
					}
				}
			}
			this.fetching = false;
		});
	},
	methods: {
		thumbnail(image: any): string {
			return this.$store.state.device.disableShowingAnimatedImages
				? getStaticImageUrl(image.thumbnailUrl)
				: image.thumbnailUrl;
		},
	},
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
			height 90px
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
		color var(--text)

		> i
			margin-right 4px

</style>

