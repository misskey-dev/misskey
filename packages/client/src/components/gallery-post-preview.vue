<template>
<MkA :to="`/gallery/${post.id}`" class="ttasepnz _panel" tabindex="-1">
	<div class="thumbnail">
		<ImgWithBlurhash class="img" :src="post.files[0].thumbnailUrl" :hash="post.files[0].blurhash"/>
	</div>
	<article>
		<header>
			<MkAvatar :user="post.user" class="avatar"/>
		</header>
		<footer>
			<span class="title">{{ post.title }}</span>
		</footer>
	</article>
</MkA>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { userName } from '@/filters/user';
import ImgWithBlurhash from '@/components/img-with-blurhash.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		ImgWithBlurhash
	},
	props: {
		post: {
			type: Object,
			required: true
		},
	},
	methods: {
		userName
	}
});
</script>

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
		transition: all 0.5s ease;

		> .img {
			width: 100%;
			height: 100%;
			object-fit: cover;
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
