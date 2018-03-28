<template>
<div class="mkw-slideshow" :data-mobile="isMobile">
	<div @click="choose">
		<p v-if="props.folder === undefined">
			<template v-if="isCustomizeMode">フォルダを指定するには、カスタマイズモードを終了してください</template>
			<template v-else>クリックしてフォルダを指定してください</template>
		</p>
		<p v-if="props.folder !== undefined && images.length == 0 && !fetching">このフォルダには画像がありません</p>
		<div ref="slideA" class="slide a"></div>
		<div ref="slideB" class="slide b"></div>
	</div>
</div>
</template>

<script lang="ts">
import * as anime from 'animejs';
import define from '../../../common/define-widget';
export default define({
	name: 'slideshow',
	props: () => ({
		folder: undefined,
		size: 0
	})
}).extend({
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

			this.applySize();
		},
		change() {
			if (this.images.length == 0) return;

			const index = Math.floor(Math.random() * this.images.length);
			const img = `url(${ this.images[index].url }?thumbnail&size=1024)`;

			(this.$refs.slideB as any).style.backgroundImage = img;

			anime({
				targets: this.$refs.slideB,
				opacity: 1,
				duration: 1000,
				easing: 'linear',
				complete: () => {
					// 既にこのウィジェットがunmountされていたら要素がない
					if ((this.$refs.slideA as any) == null) return;

					(this.$refs.slideA as any).style.backgroundImage = img;
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

			(this as any).api('drive/files', {
				folder_id: this.props.folder,
				type: 'image/*',
				limit: 100
			}).then(images => {
				this.images = images;
				this.fetching = false;
				(this.$refs.slideA as any).style.backgroundImage = '';
				(this.$refs.slideB as any).style.backgroundImage = '';
				this.change();
			});
		},
		choose() {
			(this as any).apis.chooseDriveFolder().then(folder => {
				this.props.folder = folder ? folder.id : null;
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
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	&[data-mobile]
		border none
		border-radius 8px
		box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

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
