<template>
<a class="mk-images-image"
	:href="image.url"
	@mousemove="onMousemove"
	@mouseleave="onMouseleave"
	@click.prevent="onClick"
	:style="styles"
	:title="image.name"></a>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['image'],
	computed: {
		style(): any {
			return {
				'background-color': this.image.properties.average_color ? `rgb(${this.image.properties.average_color.join(',')})` : 'transparent',
				'background-image': `url(${this.image.url}?thumbnail&size=512)`
			};
		}
	},
	methods: {
		onMousemove(e) {
			const rect = this.$refs.view.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			const xp = mouseX / this.$el.offsetWidth * 100;
			const yp = mouseY / this.$el.offsetHeight * 100;
			this.$el.style.backgroundPosition = xp + '% ' + yp + '%';
			this.$el.style.backgroundImage = 'url("' + this.image.url + '?thumbnail")';
		},

		onMouseleave() {
			this.$el.style.backgroundPosition = '';
		},

		onClick(ev) {
			riot.mount(document.body.appendChild(document.createElement('mk-image-dialog')), {
				image: this.image
			});
			return false;
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-images-image
	display block
	overflow hidden
	border-radius 4px

	> a
		display block
		cursor zoom-in
		overflow hidden
		width 100%
		height 100%
		background-position center

		&:not(:hover)
			background-size cover

</style>
