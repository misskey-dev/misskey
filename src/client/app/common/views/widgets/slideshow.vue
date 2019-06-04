<template>
<div class="mkw-slideshow" :data-mobile="platform == 'mobile'">
	<div @click="choose">
		<p v-if="props.folder === undefined">
			<template v-if="isCustomizeMode">{{ $t('folder-customize-mode') }}</template>
			<template v-else>{{ $t('folder') }}</template>
		</p>
		<p v-if="props.folder !== undefined && images.length == 0 && !fetching">{{ $t('no-image') }}</p>
		<div ref="slideA" class="slide a"></div>
		<div ref="slideB" class="slide b"></div>
	</div>
</div>
</template>

<script lang="ts">
import anime from 'animejs';
import define from '../../../common/define-widget';
import i18n from '../../../i18n';

export default define({
	name: 'slideshow',
	props: () => ({
		folder: undefined,
		size: 0
	})
}).extend({
	i18n: i18n('common/views/widgets/slideshow.vue'),

	data() {
		return {
			images: [],
			fetching: true,
			clock: null
		};
	},
	mounted() {
		this.$nextTick(() => {
			this.applySize();
		});

		if (this.props.folder !== undefined) {
			this.fetch();
		}

		this.clock = setInterval(this.change, 10000);
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
		func() {
			this.resize();
		},
		applySize() {
			let h;

			if (this.props.size == 1) {
				h = 250;
			} else {
				h = 170;
			}

			this.$el.style.height = `${h}px`;
		},
		resize() {
			if (this.props.size == 1) {
				this.props.size = 0;
			} else {
				this.props.size++;
			}
			this.save();

			this.applySize();
		},
		change() {
			if (this.images.length == 0) return;

			const index = Math.floor(Math.random() * this.images.length);
			const img = `url(${ this.images[index].url })`;

			(this.$refs.slideB as unknown).style.backgroundImage = img;

			anime({
				targets: this.$refs.slideB,
				opacity: 1,
				duration: 1000,
				easing: 'linear',
				complete: () => {
					// 既にこのウィジェットがunmountされていたら要素がない
					if ((this.$refs.slideA as unknown) == null) return;

					(this.$refs.slideA as unknown).style.backgroundImage = img;
					anime({
						targets: this.$refs.slideB,
						opacity: 0,
						duration: 0
					});
				}
			});
		},
		fetch() {
			this.fetching = true;

			this.$root.api('drive/files', {
				folderId: this.props.folder,
				type: 'image/*',
				limit: 100
			}).then(images => {
				this.images = images;
				this.fetching = false;
				(this.$refs.slideA as unknown).style.backgroundImage = '';
				(this.$refs.slideB as unknown).style.backgroundImage = '';
				this.change();
			});
		},
		choose() {
			this.$chooseDriveFolder().then(folder => {
				this.props.folder = folder ? folder.id : null;
				this.save();
				this.fetch();
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-slideshow
	overflow hidden
	background #fff
	border solid 1px rgba(#000, 0.075)
	border-radius 6px

	&[data-mobile]
		border none
		border-radius 8px
		box-shadow 0 0 0 1px rgba(#000, 0.2)

	> div
		width 100%
		height 100%
		cursor pointer

		> p
			display block
			margin 1em
			text-align center
			color #888

		> *
			pointer-events none

		> .slide
			position absolute
			top 0
			left 0
			width 100%
			height 100%
			background-size cover
			background-position center

			&.b
				opacity 0

</style>
