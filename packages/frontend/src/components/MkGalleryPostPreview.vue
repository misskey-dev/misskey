<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA :to="`/gallery/${post.id}`" class="ttasepnz _panel" tabindex="-1" @pointerenter="enterHover" @pointerleave="leaveHover">
	<div class="thumbnail">
		<Transition>
			<ImgWithBlurhash
				class="img layered"
				:transition="safe ? null : {
					duration: 500,
					leaveActiveClass: $style.transition_toggle_leaveActive,
					leaveToClass: $style.transition_toggle_leaveTo,
				}"
				:src="post.files[0].thumbnailUrl"
				:hash="post.files[0].blurhash"
				:forceBlurhash="!show"
			/>
		</Transition>
	</div>
	<article>
		<header>
			<MkAvatar :user="post.user" class="avatar" link preview/>
		</header>
		<footer>
			<span class="title">{{ post.title }}</span>
		</footer>
	</article>
</MkA>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { computed, ref } from 'vue';
import ImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import { defaultStore } from '@/store.js';

const props = defineProps<{
	post: Misskey.entities.GalleryPost;
}>();

const hover = ref(false);
const safe = computed(() => defaultStore.state.nsfw === 'ignore' || defaultStore.state.nsfw === 'respect' && !props.post.isSensitive);
const show = computed(() => safe.value || hover.value);

function enterHover(): void {
	hover.value = true;
}

function leaveHover(): void {
	hover.value = false;
}
</script>

<style lang="scss" module>
.transition_toggle_leaveActive {
	transition: opacity .5s;
	position: absolute;
	top: 0;
	left: 0;
}

.transition_toggle_leaveTo {
	opacity: 0;
}
</style>

<style lang="scss" scoped>
.ttasepnz {
	display: block;
	position: relative;
	height: 200px;

	&:hover {
		text-decoration: none;
		color: var(--accent);

		> .thumbnail {
			transform: scale(1.1);
		}

		> article {
			> footer {
				&:before {
					opacity: 1;
				}
			}
		}
	}

	> .thumbnail {
		width: 100%;
		height: 100%;
		position: absolute;
		transition: transform 0.5s ease;

		> .img {
			width: 100%;
			height: 100%;
			object-fit: cover;

			&.layered {
				position: absolute;
				top: 0;
			}
		}
	}

	> article {
		position: absolute;
		z-index: 1;
		width: 100%;
		height: 100%;

		> header {
			position: absolute;
			top: 0;
			width: 100%;
			padding: 12px;
			box-sizing: border-box;
			display: flex;

			> .avatar {
				margin-left: auto;
				width: 32px;
				height: 32px;
			}
		}

		> footer {
			position: absolute;
			bottom: 0;
			width: 100%;
			padding: 16px;
			box-sizing: border-box;
			color: #fff;
			text-shadow: 0 0 8px #000;
			background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));

			&:before {
				content: "";
				display: block;
				position: absolute;
				z-index: -1;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: linear-gradient(rgba(0, 0, 0, 0.4), transparent);
				opacity: 0;
				transition: opacity 0.5s ease;
			}

			> .title {
				font-weight: bold;
			}
		}
	}
}
</style>
