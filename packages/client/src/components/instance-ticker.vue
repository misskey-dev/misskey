<template>
<div class="hpaizdrt" :style="bg">
	<img v-if="instance.faviconUrl" class="icon" :src="instance.faviconUrl"/>
	<span class="name">{{ instance.name }}</span>
	<span v-if="instance.softwareName" v-tooltip="instance.softwareName + ' ' + instance.softwareVersion" class="software">{{ instance.softwareName }}</span>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import { instanceName } from '@/config';

const props = defineProps<{
	instance?: {
		faviconUrl?: string;
		name: string;
		themeColor?: string;
		softwareName?: string;
		softwareVersion?: string;
	}
}>();

// if no instance data is given, this is for the local instance
const instance = props.instance ?? {
	faviconUrl: '/favicon.ico',
	name: instanceName,
	themeColor: (document.querySelector('meta[name="theme-color-orig"]') as HTMLMetaElement)?.content,
	softwareName: 'misskey',
	softwareVersion: '',
};

const themeColor = instance.themeColor ?? '#777777';

const bg = {
	background: `linear-gradient(90deg, ${themeColor}, ${themeColor}00)`
};
</script>

<style lang="scss" scoped>
.hpaizdrt {
	$height: 1.1rem;
	position: relative;

	height: $height;
	border-radius: 4px 0 0 4px;
	overflow: hidden;
	color: #fff;
	text-shadow: /* .866 ≈ sin(60deg) */
		1px 0 1px #000,
		.866px .5px 1px #000,
		.5px .866px 1px #000,
		0 1px 1px #000,
		-.5px .866px 1px #000,
		-.866px .5px 1px #000,
		-1px 0 1px #000,
		-.866px -.5px 1px #000,
		-.5px -.866px 1px #000,
		0 -1px 1px #000,
		.5px -.866px 1px #000,
		.866px -.5px 1px #000;

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

	> .software {
		position: absolute;
		right: .3em;
		line-height: $height;
		font-size: 0.9em;
		vertical-align: top;

		color: var(--fg);
		text-shadow: none;

		text-transform: capitalize;
	}
}
</style>
