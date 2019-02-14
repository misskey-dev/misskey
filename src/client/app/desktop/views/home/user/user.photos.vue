<template>
<div class="dzsuvbsrrrwobdxifudxuefculdfiaxd">
	<p class="title"><fa icon="camera"/>{{ $t('title') }}</p>
	<p class="initializing" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('loading') }}<mk-ellipsis/></p>
	<div class="stream" v-if="!fetching && images.length > 0">
		<div v-for="(image, i) in images" :key="i" class="img"
			:style="`background-image: url(${thumbnail(image)})`"
		></div>
	</div>
	<p class="empty" v-if="!fetching && images.length == 0">{{ $t('no-photos') }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { getStaticImageUrl } from '../../../../common/scripts/get-static-image-url';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/user/user.photos.vue'),
	props: ['user'],
	data() {
		return {
			images: [],
			fetching: true
		};
	},
	mounted() {
		const image = [
			'image/jpeg',
			'image/png',
			'image/gif'
		];

		this.$root.api('users/notes', {
			userId: this.user.id,
			fileType: image,
			excludeNsfw: !this.$store.state.device.alwaysShowNsfw,
			limit: 9,
			untilDate: new Date().getTime() + 1000 * 86400 * 365
		}).then(notes => {
			for (const note of notes) {
				for (const file of note.files) {
					if (this.images.length < 9) this.images.push(file);
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
.dzsuvbsrrrwobdxifudxuefculdfiaxd
	background var(--face)
	box-shadow var(--shadow)
	border-radius var(--round)
	overflow hidden

	> .title
		z-index 1
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		background var(--faceHeader)
		color var(--faceHeaderText)
		box-shadow 0 1px rgba(#000, 0.07)

		> i
			margin-right 4px

	> .stream
		display flex
		justify-content center
		flex-wrap wrap
		padding 8px

		> .img
			flex 1 1 33%
			width 33%
			height 120px
			background-position center center
			background-size cover
			background-clip content-box
			border solid 2px transparent

	> .initializing
	> .empty
		margin 0
		padding 16px
		text-align center
		color var(--text)

		> i
			margin-right 4px

</style>
