<template>
<div class="qjewsnkgzzxlxtzncydssfbgjibiehcy" v-if="image.isSensitive && hide && !$store.state.device.alwaysShowNsfw" @click="hide = false">
	<div>
		<b><fa :icon="faExclamationTriangle"/> {{ $t('sensitive') }}</b>
		<span>{{ $t('clickToShow') }}</span>
	</div>
</div>
<div class="gqnyydlzavusgskkfvwvjiattxdzsqlf" v-else>
	<i><fa :icon="faEyeSlash" @click="hide = true"></fa></i>
	<a
		:href="image.url"
		:style="style"
		:title="image.name"
		@click.prevent="onClick"
	>
		<div v-if="image.type === 'image/gif'">GIF</div>
	</a>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faExclamationTriangle, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';
import { getStaticImageUrl } from '../scripts/get-static-image-url';
import ImageViewer from './image-viewer.vue';

export default Vue.extend({
	i18n,
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
			hide: true,
			faExclamationTriangle,
			faEyeSlash
		};
	},
	computed: {
		style(): any {
			let url = `url(${
				this.$store.state.device.disableShowingAnimatedImages
					? getStaticImageUrl(this.image.thumbnailUrl)
					: this.image.thumbnailUrl
			})`;

			if (this.$store.state.device.loadRemoteMedia) {
				url = null;
			} else if (this.raw || this.$store.state.device.loadRawImages) {
				url = `url(${this.image.url})`;
			}

			return {
				'background-color': this.image.properties.avgColor || 'transparent',
				'background-image': url
			};
		}
	},
	methods: {
		onClick() {
			if (this.$store.state.device.imageNewTab) {
				window.open(this.image.url, '_blank');
			} else {
				const viewer = this.$root.new(ImageViewer, {
					image: this.image
				});
				this.$once('hook:beforeDestroy', () => {
					viewer.close();
				});
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.gqnyydlzavusgskkfvwvjiattxdzsqlf {
	position: relative;

	> i {
		display: block;
		position: absolute;
		border-radius: 6px;
		background-color: var(--fg);
		color: var(--accentLighten);
		font-size: 14px;
		opacity: .5;
		padding: 3px 6px;
		text-align: center;
		cursor: pointer;
		top: 12px;
		right: 12px;
	}

	> a {
		display: block;
		cursor: zoom-in;
		overflow: hidden;
		width: 100%;
		height: 100%;
		background-position: center;
		background-size: contain;
		background-repeat: no-repeat;

		> div {
			background-color: var(--fg);
			border-radius: 6px;
			color: var(--accentLighten);
			display: inline-block;
			font-size: 14px;
			font-weight: bold;
			left: 12px;
			opacity: .5;
			padding: 0 6px;
			text-align: center;
			top: 12px;
			pointer-events: none;
		}
	}
}

.qjewsnkgzzxlxtzncydssfbgjibiehcy {
	display: flex;
	justify-content: center;
	align-items: center;
	background: #111;
	color: #fff;

	> div {
		display: table-cell;
		text-align: center;
		font-size: 12px;

		> * {
			display: block;
		}
	}
}
</style>
