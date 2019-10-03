<template>
<div class="jxdyxsek">
	<div class="body">
		<header>
			<h1><fa :icon="faCrop" />{{ title }}</h1>
			<button class="close" @click="cancel"><fa icon="times"/></button>
			<button class="menu" @click="menu"><fa :icon="faEllipsisH"/></button>
			<button class="ok" @click="ok"><fa icon="check"/></button>
		</header>
		<vue-cropper class="cropper" ref="cropper"
			:src="imageUrl"
			:view-mode="1"
			:aspect-ratio="aspectRatio"
			:container-style="{ width: '100%', 'max-height': '100%' }"
		/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import VueCropper from 'vue-cropperjs';
import * as url from '../../../../../prelude/url';
import { faEllipsisH, faCrop } from '@fortawesome/free-solid-svg-icons'
import XMenu from '../../../common/views/components/menu.vue';

export default Vue.extend({
	i18n: i18n('mobile/views/components/crop.vue'),
	components: {
		VueCropper
	},
	props: {
		image: {
			type: Object,
			required: true
		},
		title: {
			type: String,
			required: true
		},
		aspectRatio: {
			type: Number,
			required: true
		}
	},

	data() {
		return {
			faEllipsisH,
			faCrop
		}
	},

	computed: {
		imageUrl() {
			return `/proxy/?${url.query({
				url: this.image.url
			})}`;
		},
	},
	methods: {
		ok() {
			(this.$refs.cropper as any).getCroppedCanvas().toBlob(blob => {
				this.$emit('cropped', blob);
				this.destroyDom();
			});
		},

		skip() {
			this.$emit('skipped');
			this.destroyDom();
		},

		menu(ev: any) {
			this.$root.new(XMenu, {
				items: [{
					type: 'item',
					text: this.$t('skip'),
					action: this.skip
				}],
				source: ev.currentTarget || ev.target
			})
		}

		cancel() {
			this.$emit('canceled');
			this.destroyDom();
		}
	}
});
</script>

<style lang="stylus" scoped>
.jxdyxsek
	position fixed
	z-index 9999
	top 0
	left 0
	width 100%
	height 100%
	padding 8px
	background rgba(#000, 0.2)

	> .body
		width 100%
		height 100%
		background var(--faceHeader)

		> header
			border-bottom solid 1px var(--faceDivider)
			color var(--text)
			height 42px

			> h1
				margin 0
				padding 0
				text-align center
				line-height 42px
				font-size 1em
				font-weight normal
				width calc(100% - 42px)

				> .count
					margin-left 4px
					opacity 0.5

			> .close
				position absolute
				top 0
				left 0
				line-height 42px
				width 42px

			> .menu
				position absolute
				top 0
				right 42px
				line-height 42px
				width 42px

			> .ok
				position absolute
				top 0
				right 0
				line-height 42px
				width 42px

		> .cropper
			height calc(100% - 42px)
			overflow scroll
			-webkit-overflow-scrolling touch

			.img
				width 100%
				max-height 400px
</style>

<style lang="stylus">
.cropper-modal {
	opacity: 0.8;
}

.cropper-view-box {
	outline-color: var(--primary);
}

.cropper-line, .cropper-point {
	background-color: var(--primary);
}

.cropper-bg {
	animation: cropper-bg 0.5s linear infinite;
}

@keyframes cropper-bg {
	0% {
		background-position: 0 0;
	}

	100% {
		background-position: -8px -8px;
	}
}
</style>
