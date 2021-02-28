<template>
<div class="hpaizdrt" :style="bg">
	<img v-if="info.faviconUrl" class="icon" :src="info.faviconUrl"/>
	<span class="name">{{ info.name }}</span>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { instanceName } from '@/config';

export default defineComponent({
	props: {
		instance: {
			type: Object,
			required: false
		},
	},

	data() {
		return {
			info: this.instance || {
				faviconUrl: '/favicon.ico',
				name: instanceName,
				themeColor: (document.querySelector('meta[name="theme-color-orig"]') as HTMLMetaElement)?.content
			}
		}
	},

	computed: {
		bg(): any {
			const themeColor = this.info.themeColor || '#777777';
			return {
				background: `linear-gradient(90deg, ${themeColor}, ${themeColor + '00'})`
			};
		}
	}
});
</script>

<style lang="scss" scoped>
.hpaizdrt {
	$height: 1.1rem;

	height: $height;
	border-radius: 4px 0 0 4px;
	overflow: hidden; // overflow: clip; をSafariが対応したら消す
	overflow: clip;
	color: #fff;

	> .icon {
		height: 100%;
	}

	> .name {
		margin-left: 4px;
		line-height: $height;
		font-size: 0.9em;
		vertical-align: top;
		font-weight: bold;
	}
}
</style>
