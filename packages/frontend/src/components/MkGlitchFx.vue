<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span :class="$style.root">
	<span :class="$style.content">
		<slot></slot>
	</span>

	<svg width="0" height="0" xmlns="http://www.w3.org/2000/svg">
		<filter id="MkGlitchFx_svg">
			<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g"/>
			<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b"/>
			<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
			<feOffset dx="8" dy="0"/>
			<feComposite in="g" in2="" operator="lighter"/>
			<feComposite in="b" in2="" operator="lighter" result="rgb-layers"/>

			<feTurbulence type="fractalNoise" baseFrequency="0 0.02" numOctaves="3" :seed="seed"/>
			<feColorMatrix type="luminanceToAlpha"/>
			<feComponentTransfer>
				<feFuncA type="discrete" tableValues="0,1"/>
			</feComponentTransfer>
			<feComposite in2="rgb-layers" operator="xor"/>
			<feOffset dx="8" dy="0"/>
			<feComposite in2="rgb-layers" operator="over" result="temp1"/>
			<feComponentTransfer>
				<feFuncA type="discrete" tableValues="1"/>
			</feComponentTransfer>

			<feColorMatrix
				in="temp1"
				type="matrix"
				values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 100 100 100 0 0 "
			></feColorMatrix>
		</filter>
	</svg>
</span>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { useInterval } from '@@/js/use-interval.js';

const seed = ref('0');

useInterval(() => {
	seed.value = Math.floor(Math.random() * 1000).toString();
}, 70, {
	immediate: true,
	afterMounted: true,
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	//clip-path: inset(15px);
}

.content {
	display: block;
	filter: url(#MkGlitchFx_svg);
}
</style>
