<template>
<div class="icozogqfvdetwohsdglrbswgrejoxbdj" v-if="hide" @click="hide = false">
	<div>
		<b><Fa :icon="faExclamationTriangle"/> {{ $t('sensitive') }}</b>
		<span>{{ $t('clickToShow') }}</span>
	</div>
</div>
<div class="kkjnbbplepmiyuadieoenjgutgcmtsvu" v-else>
	<i><Fa :icon="faEyeSlash" @click="hide = true"/></i>
	<a
		:href="video.url"
		rel="nofollow noopener"
		target="_blank"
		:style="imageStyle"
		:title="video.name"
	>
		<Fa :icon="faPlayCircle"/>
	</a>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { faExclamationTriangle, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';

export default defineComponent({
	props: {
		video: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			hide: true,
			faPlayCircle,
			faExclamationTriangle,
			faEyeSlash
		};
	},
	computed: {
		imageStyle(): any {
			return {
				'background-image': `url(${this.video.thumbnailUrl})`
			};
		}
	},
	created() {
		this.hide = (this.$store.state.device.nsfw === 'force') ? true : this.video.isSensitive && (this.$store.state.device.nsfw !== 'ignore');
	},
});
</script>

<style lang="scss" scoped>
.kkjnbbplepmiyuadieoenjgutgcmtsvu {
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
		display: flex;
		justify-content: center;
		align-items: center;

		font-size: 3.5em;
		overflow: hidden;
		background-position: center;
		background-size: cover;
		width: 100%;
		height: 100%;
	}
}

.icozogqfvdetwohsdglrbswgrejoxbdj {
	display: flex;
	justify-content: center;
	align-items: center;
	background: #111;
	color: #fff;

	> div {
		display: table-cell;
		text-align: center;
		font-size: 12px;

		> b {
			display: block;
		}
	}
}
</style>
