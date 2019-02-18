<template>
	<mk-window ref="window" is-modal width="800px" :can-close="false">
		<template #header><fa icon="crop"/>{{ title }}</template>
		<div class="body">
			<vue-cropper ref="cropper"
				:src="image.url"
				:view-mode="1"
				:aspect-ratio="aspectRatio"
				:container-style="{ width: '100%', 'max-height': '400px' }"
			/>
		</div>
		<div :class="$style.actions">
			<button :class="$style.skip" @click="skip">{{ $t('skip') }}</button>
			<button :class="$style.cancel" @click="cancel">{{ $t('cancel') }}</button>
			<button :class="$style.ok" @click="ok">{{ $t('ok') }}</button>
		</div>
	</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import VueCropper from 'vue-cropperjs';

export default Vue.extend({
	i18n: i18n('desktop/views/components/crop-window.vue'),
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
	methods: {
		ok() {
			(this.$refs.cropper as any).getCroppedCanvas().toBlob(blob => {
				this.$emit('cropped', blob);
				(this.$refs.window as any).close();
			});
		},

		skip() {
			this.$emit('skipped');
			(this.$refs.window as any).close();
		},

		cancel() {
			this.$emit('canceled');
			(this.$refs.window as any).close();
		}
	}
});
</script>

<style lang="stylus" module>


.header
	> [data-icon]
		margin-right 4px

.img
	width 100%
	max-height 400px

.actions
	height 72px
	background var(--primaryLighten95)

.ok
.cancel
.skip
	display block
	position absolute
	bottom 16px
	cursor pointer
	padding 0
	margin 0
	height 40px
	font-size 1em
	outline none
	border-radius 4px

	&:focus
		&:after
			content ""
			pointer-events none
			position absolute
			top -5px
			right -5px
			bottom -5px
			left -5px
			border 2px solid var(--primaryAlpha03)
			border-radius 8px

	&:disabled
		opacity 0.7
		cursor default

.ok
.cancel
	width 120px

.ok
	right 16px
	color var(--primaryForeground)
	background linear-gradient(to bottom, var(--primaryLighten25) 0%, var(--primaryLighten10) 100%)
	border solid 1px var(--primaryLighten15)

	&:not(:disabled)
		font-weight bold

	&:hover:not(:disabled)
		background linear-gradient(to bottom, var(--primaryLighten8) 0%, var(--primaryDarken8) 100%)
		border-color var(--primary)

	&:active:not(:disabled)
		background var(--primary)
		border-color var(--primary)

.cancel
.skip
	color #888
	background linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%)
	border solid 1px #e2e2e2

	&:hover
		background linear-gradient(to bottom, #f9f9f9 0%, #ececec 100%)
		border-color #dcdcdc

	&:active
		background #ececec
		border-color #dcdcdc

.cancel
	right 148px

.skip
	left 16px
	width 150px

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
