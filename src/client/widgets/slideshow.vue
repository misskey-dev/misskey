<template>
<div class="kvausudm _panel">
	<div @click="choose">
		<p v-if="props.folderId == null">
			<template v-if="isCustomizeMode">{{ $t('folder-customize-mode') }}</template>
			<template v-else>{{ $ts.folder }}</template>
		</p>
		<p v-if="props.folderId != null && images.length === 0 && !fetching">{{ $t('no-image') }}</p>
		<div ref="slideA" class="slide a"></div>
		<div ref="slideB" class="slide b"></div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import define from './define';
import * as os from '@client/os';

const widget = define({
	name: 'slideshow',
	props: () => ({
		height: {
			type: 'number',
			default: 300,
		},
		folderId: {
			type: 'string',
			default: null,
			hidden: true,
		},
	})
});

export default defineComponent({
	extends: widget,
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

		if (this.props.folderId != null) {
			this.fetch();
		}

		this.clock = setInterval(this.change, 10000);
	},
	beforeUnmount() {
		clearInterval(this.clock);
	},
	methods: {
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

			(this.$refs.slideB as any).style.backgroundImage = img;

			this.$refs.slideB.classList.add('anime');
			setTimeout(() => {
				// 既にこのウィジェットがunmountされていたら要素がない
				if ((this.$refs.slideA as any) == null) return;

				(this.$refs.slideA as any).style.backgroundImage = img;

				this.$refs.slideB.classList.remove('anime');
			}, 1000);
		},
		fetch() {
			this.fetching = true;

			os.api('drive/files', {
				folderId: this.props.folderId,
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
			os.selectDriveFolder(false).then(folder => {
				if (folder == null) {
					return;
				}
				this.props.folderId = folder.id;
				this.save();
				this.fetch();
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.kvausudm {
	position: relative;

	> div {
		width: 100%;
		height: 100%;
		cursor: pointer;

		> p {
			display: block;
			margin: 1em;
			text-align: center;
			color: #888;
		}

		> * {
			pointer-events: none;
		}

		> .slide {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-size: cover;
			background-position: center;

			&.b {
				opacity: 0;
			}

			&.anime {
				transition: opacity 1s;
				opacity: 1;
			}
		}
	}
}
</style>
