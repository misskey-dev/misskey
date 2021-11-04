<template>
<div class="icozogqfvdetwohsdglrbswgrejoxbdj" v-if="hide" @click="hide = false">
	<div>
		<b><i class="fas fa-exclamation-triangle"></i> {{ $ts.sensitive }}</b>
		<span>{{ $ts.clickToShow }}</span>
	</div>
</div>
<div class="kkjnbbplepmiyuadieoenjgutgcmtsvu" v-else>
	<video
		:poster="video.thumbnailUrl"
		:title="video.name"
		preload="none"
		controls
		@contextmenu.stop
	>
		<source 
			:src="video.url" 
			:type="video.type"
		>
	</video>
	<i class="fas fa-eye-slash" @click="hide = true"></i>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@client/os';

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
		};
	},
	created() {
		this.hide = (this.$store.state.nsfw === 'force') ? true : this.video.isSensitive && (this.$store.state.nsfw !== 'ignore');
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

	> video {
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
