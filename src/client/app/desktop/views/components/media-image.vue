<template>
<a class="mk-media-image"
	:href="image.url"
	@mousemove="onMousemove"
	@mouseleave="onMouseleave"
	@click.prevent="onClick"
	:style="style"
	:title="image.name"
></a>
</template>

<script lang="ts">
import Vue from 'vue';
import MkMediaImageDialog from './media-image-dialog.vue';

export default Vue.extend({
	props: {
		image: {
			type: Object,
			required: true
		},
		raw: {
			default: false
		}
	},
	computed: {
		style(): any {
			return {
				'background-color': this.image.properties.avgColor && this.image.properties.avgColor.length == 3 ? `rgb(${this.image.properties.avgColor.join(',')})` : 'transparent',
				'background-image': this.raw ? `url(${this.image.url})` : `url(${this.image.url}?thumbnail&size=512)`
			};
		}
	},
	methods: {
		onMousemove(e) {
			const rect = this.$el.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			const xp = mouseX / this.$el.offsetWidth * 100;
			const yp = mouseY / this.$el.offsetHeight * 100;
			this.$el.style.backgroundPosition = xp + '% ' + yp + '%';
			this.$el.style.backgroundImage = `url("${this.image.url}")`;
		},

		onMouseleave() {
			this.$el.style.backgroundPosition = '';
		},

		onClick() {
			(this as any).os.new(MkMediaImageDialog, {
				image: this.image
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-media-image
	display block
	cursor zoom-in
	overflow hidden
	width 100%
	height 100%
	background-position center
	border-radius 4px

	&:not(:hover)
		background-size cover

</style>
