<template>
<div class="mk-media-list">
	<template v-for="media in mediaList.filter(media => !previewable(media))">
		<x-banner :media="media" :key="media.id"/>
	</template>
	<div v-if="mediaList.filter(media => previewable(media)).length > 0" class="gird-container" ref="gridOuter">
		<div :data-count="mediaList.filter(media => previewable(media)).length" :style="gridInnerStyle">
			<template v-for="media in mediaList">
				<x-video :video="media" :key="media.id" v-if="media.type.startsWith('video')"/>
				<x-image :image="media" :key="media.id" v-else-if="media.type.startsWith('image')" :raw="raw"/>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XBanner from './media-banner.vue';
import XImage from './media-image.vue';
import XVideo from './media-video.vue';

export default Vue.extend({
	components: {
		XBanner,
		XImage,
		XVideo,
	},
	props: {
		mediaList: {
			required: true
		},
		raw: {
			default: false
		},
		// specify the parent element
		parentElement: {
			type: Object
		}
	},
	data() {
		return {
			gridInnerStyle: {},
			sizeWaiting: false
		}
	},
	mounted() {
		this.size();
		window.addEventListener('resize', this.size);
	},
	beforeDestroy() {
		window.removeEventListener('resize', this.size);
	},
	activated() {
		this.size();
	},
	methods: {
		previewable(file) {
			return file.type.startsWith('video') || file.type.startsWith('image');
		},
		size() {
			// for Safari bug
			if (this.sizeWaiting) return;

			this.sizeWaiting = true;

			window.requestAnimationFrame(() => {
				this.sizeWaiting = false;

				if (this.$refs.gridOuter) {
					let height = 287;
					const parent = this.$props.parentElement || this.$parent.$el;

					if (this.$refs.gridOuter.clientHeight) {
						height = this.$refs.gridOuter.clientHeight;
					} else if (parent) {
						height = parent.getBoundingClientRect().width * 9 / 16;
					}

					this.gridInnerStyle = { height: `${height}px` };
				} else {
					this.gridInnerStyle = {};
				}
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-media-list {
	> .gird-container {
		position: relative;
		width: 100%;
		margin-top: 4px;

		&:before {
			content: '';
			display: block;
			padding-top: 56.25% // 16:9;
		}

		> div {
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			display: grid;
			grid-gap: 4px;

			> * {
				overflow: hidden;
				border-radius: 4px;
			}

			&[data-count="1"] {
				grid-template-rows: 1fr;
			}

			&[data-count="2"] {
				grid-template-columns: 1fr 1fr;
				grid-template-rows: 1fr;
			}

			&[data-count="3"] {
				grid-template-columns: 1fr 0.5fr;
				grid-template-rows: 1fr 1fr;

				> *:nth-child(1) {
					grid-row: 1 / 3;
				}

				> *:nth-child(3) {
					grid-column: 2 / 3;
					grid-row: 2 / 3;
				}
			}

			&[data-count="4"] {
				grid-template-columns: 1fr 1fr;
				grid-template-rows: 1fr 1fr;
			}

			> *:nth-child(1) {
				grid-column: 1 / 2;
				grid-row: 1 / 2;
			}

			> *:nth-child(2) {
				grid-column: 2 / 3;
				grid-row: 1 / 2;
			}

			> *:nth-child(3) {
				grid-column: 1 / 2;
				grid-row: 2 / 3;
			}

			> *:nth-child(4) {
				grid-column: 2 / 3;
				grid-row: 2 / 3;
			}
		}
	}
}
</style>
