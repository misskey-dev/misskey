<template>
<div class="icozogqfvdetwohsdglrbswgrejoxbdj" v-if="video.isSensitive && hide && !$store.state.device.alwaysShowNsfw" @click="hide = false">
	<div>
		<b><fa icon="exclamation-triangle"/> {{ $t('sensitive') }}</b>
		<span>{{ $t('clickToShow') }}</span>
	</div>
</div>
<a class="kkjnbbplepmiyuadieoenjgutgcmtsvu" v-else
	:href="video.url"
	rel="nofollow noopener"
	target="_blank"
	:style="imageStyle"
	:title="video.name"
>
	<fa :icon="faPlayCircle"/>
</a>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import i18n from '../i18n';

export default Vue.extend({
	i18n,
	props: {
		video: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			hide: true,
			faPlayCircle
		};
	},
	computed: {
		imageStyle(): any {
			return {
				'background-image': `url(${this.video.thumbnailUrl})`
			};
		}
	}
});
</script>

<style lang="scss" scoped>
.kkjnbbplepmiyuadieoenjgutgcmtsvu {
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
