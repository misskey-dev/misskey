<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component :is="link ? EmA : 'span'" v-bind="bound" class="_noSelect" :class="[$style.root, { [$style.cat]: user.isCat }]">
	<EmImgWithBlurhash :class="$style.inner" :src="url" :hash="user.avatarBlurhash" :cover="true" :onlyAvgColor="true"/>
	<div v-if="user.isCat" :class="[$style.ears]">
		<div :class="$style.earLeft">
			<div v-if="false" :class="$style.layer">
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
			</div>
		</div>
		<div :class="$style.earRight">
			<div v-if="false" :class="$style.layer">
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
			</div>
		</div>
	</div>
	<img
		v-for="decoration in user.avatarDecorations"
		:class="[$style.decoration]"
		:src="getDecorationUrl(decoration)"
		:style="{
			rotate: getDecorationAngle(decoration),
			scale: getDecorationScale(decoration),
			translate: getDecorationOffset(decoration),
		}"
		alt=""
	>
</component>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import EmImgWithBlurhash from './EmImgWithBlurhash.vue';
import EmA from './EmA.vue';
import { userPage } from '@/utils.js';

const props = withDefaults(defineProps<{
	user: Misskey.entities.User;
	link?: boolean;
	preview?: boolean;
	indicator?: boolean;
}>(), {
	link: false,
	preview: false,
	indicator: false,
});

const emit = defineEmits<{
	(ev: 'click', v: MouseEvent): void;
}>();

const bound = computed(() => props.link
	? { to: userPage(props.user) }
	: {});

const url = computed(() => {
	if (props.user.avatarUrl == null) return null;
	return props.user.avatarUrl;
});

function getDecorationUrl(decoration: Omit<Misskey.entities.UserDetailed['avatarDecorations'][number], 'id'>) {
	return decoration.url;
}

function getDecorationAngle(decoration: Omit<Misskey.entities.UserDetailed['avatarDecorations'][number], 'id'>) {
	const angle = decoration.angle ?? 0;
	return angle === 0 ? undefined : `${angle * 360}deg`;
}

function getDecorationScale(decoration: Omit<Misskey.entities.UserDetailed['avatarDecorations'][number], 'id'>) {
	const scaleX = decoration.flipH ? -1 : 1;
	return scaleX === 1 ? undefined : `${scaleX} 1`;
}

function getDecorationOffset(decoration: Omit<Misskey.entities.UserDetailed['avatarDecorations'][number], 'id'>) {
	const offsetX = decoration.offsetX ?? 0;
	const offsetY = decoration.offsetY ?? 0;
	return offsetX === 0 && offsetY === 0 ? undefined : `${offsetX * 100}% ${offsetY * 100}%`;
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: inline-block;
	vertical-align: bottom;
	flex-shrink: 0;
	border-radius: 100%;
	line-height: 16px;
}

.inner {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	top: 0;
	border-radius: 100%;
	z-index: 1;
	overflow: clip;
	object-fit: cover;
	width: 100%;
	height: 100%;
}

.indicator {
	position: absolute;
	z-index: 2;
	bottom: 0;
	left: 0;
	width: 20%;
	height: 20%;
}

.cat {
	> .ears {
		contain: strict;
		position: absolute;
		top: -50%;
		left: -50%;
		width: 100%;
		height: 100%;
		padding: 50%;
		pointer-events: none;

		> .earLeft,
		> .earRight {
			contain: strict;
			display: inline-block;
			height: 50%;
			width: 50%;
			background: currentColor;

			&::after {
				contain: strict;
				content: '';
				display: block;
				width: 60%;
				height: 60%;
				margin: 20%;
				background: #df548f;
			}

			> .layer {
				contain: strict;
				position: absolute;
				top: 0;
				width: 280%;
				height: 280%;

				> .plot {
					contain: strict;
					position: absolute;
					width: 100%;
					height: 100%;
					clip-path: path('M0 0H1V1H0z');
					transform: scale(32767);
					transform-origin: 0 0;
					opacity: 0.5;

					&:first-child {
						opacity: 1;
					}

					&:last-child {
						opacity: calc(1 / 3);
					}
				}
			}
		}

		> .earLeft {
			transform: rotate(37.5deg) skew(30deg);

			&, &::after {
				border-radius: 25% 75% 75%;
			}

			> .layer {
				left: 0;
				transform:
					skew(-30deg)
					rotate(-37.5deg)
					translate(-2.82842712475%, /* -2 * sqrt(2) */
										-38.5857864376%); /* 40 - 2 * sqrt(2) */

				> .plot {
					background-position: 20% 10%; /* ~= 37.5deg */

					&:first-child {
						background-position-x: 21%;
					}

					&:last-child {
						background-position-y: 11%;
					}
				}
			}
		}

		> .earRight {
			transform: rotate(-37.5deg) skew(-30deg);

			&, &::after {
				border-radius: 75% 25% 75% 75%;
			}

			> .layer {
				right: 0;
				transform:
					skew(30deg)
					rotate(37.5deg)
					translate(2.82842712475%, /* 2 * sqrt(2) */
										-38.5857864376%); /* 40 - 2 * sqrt(2) */

				> .plot {
					position: absolute;
					background-position: 80% 10%; /* ~= 37.5deg */

					&:first-child {
						background-position-x: 79%;
					}

					&:last-child {
						background-position-y: 11%;
					}
				}
			}
		}
	}
}

.decoration {
	position: absolute;
	z-index: 1;
	top: -50%;
	left: -50%;
	width: 200%;
	pointer-events: none;
}
</style>
