<template>
<div class="qjewsnkgzzxlxtzncydssfbgjibiehcy" v-if="image.isSensitive && hide && !$store.state.device.alwaysShowNsfw" @click="hide = false">
	<div>
		<b><fa icon="exclamation-triangle"/> {{ $t('sensitive') }}</b>
		<span>{{ $t('click-to-show') }}</span>
	</div>
</div>
<a class="gqnyydlzavusgskkfvwvjiattxdzsqlf" v-else
	:href="image.url"
	:style="style"
	:title="image.name"
	@click.prevent="onClick"
>
	<div v-if="image.type === 'image/gif'">GIF</div>
</a>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import ImageViewer from './image-viewer.vue';
import { getStaticImageUrl } from '../../../common/scripts/get-static-image-url';

export default Vue.extend({
	i18n: i18n('common/views/components/media-image.vue'),
	props: {
		image: {
			type: Object,
			required: true
		},
		raw: {
			default: false
		}
	},
	data() {
		return {
			hide: true
		};
	}
	computed: {
		style(): any {
			let url = `url(${
				this.$store.state.device.disableShowingAnimatedImages
					? getStaticImageUrl(this.image.thumbnailUrl)
					: this.image.thumbnailUrl
			})`;

			if (this.$store.state.device.loadRemoteMedia || this.$store.state.device.lightmode) {
				url = null;
			} else if (this.raw || this.$store.state.device.loadRawImages) {
				url = `url(${this.image.url})`;
			}

			return {
				'background-color': this.image.properties.avgColor && this.image.properties.avgColor.length == 3 ? `rgb(${this.image.properties.avgColor.join(',')})` : 'transparent',
				'background-image': url
			};
		}
	},
	methods: {
		onClick() {
			this.$root.new(ImageViewer, {
				image: this.image
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.gqnyydlzavusgskkfvwvjiattxdzsqlf
	display block
	cursor zoom-in
	overflow hidden
	width 100%
	height 100%
	background-position center
	background-size contain
	background-repeat no-repeat

	> div
		background-color var(--text)
		border-radius 6px
		color var(--secondary)
		display inline-block
		font-size 14px
		font-weight bold
		left 12px
		opacity .5
		padding 0 6px
		text-align center
		top 12px
		pointer-events none

.qjewsnkgzzxlxtzncydssfbgjibiehcy
	display flex
	justify-content center
	align-items center
	background #111
	color #fff

	> div
		display table-cell
		text-align center
		font-size 12px

		> *
			display block

</style>
