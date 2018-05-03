<template>
<div class="mk-uploader">
	<ol v-if="uploads.length > 0">
		<li v-for="ctx in uploads" :key="ctx.id">
			<div class="img" :style="{ backgroundImage: `url(${ ctx.img })` }"></div>
			<p class="name">%fa:spinner .pulse%{{ ctx.name }}</p>
			<p class="status">
				<span class="initing" v-if="ctx.progress == undefined">%i18n:@waiting%<mk-ellipsis/></span>
				<span class="kb" v-if="ctx.progress != undefined">{{ String(Math.floor(ctx.progress.value / 1024)).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') }}<i>KB</i> / {{ String(Math.floor(ctx.progress.max / 1024)).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') }}<i>KB</i></span>
				<span class="percentage" v-if="ctx.progress != undefined">{{ Math.floor((ctx.progress.value / ctx.progress.max) * 100) }}</span>
			</p>
			<progress v-if="ctx.progress != undefined && ctx.progress.value != ctx.progress.max" :value="ctx.progress.value" :max="ctx.progress.max"></progress>
			<div class="progress initing" v-if="ctx.progress == undefined"></div>
			<div class="progress waiting" v-if="ctx.progress != undefined && ctx.progress.value == ctx.progress.max"></div>
		</li>
	</ol>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl } from '../../../config';

export default Vue.extend({
	data() {
		return {
			uploads: []
		};
	},
	methods: {
		upload(file, folder) {
			if (folder && typeof folder == 'object') folder = folder.id;

			const id = Math.random();

			const ctx = {
				id: id,
				name: file.name || 'untitled',
				progress: undefined,
				img: undefined
			};

			this.uploads.push(ctx);
			this.$emit('change', this.uploads);

			const reader = new FileReader();
			reader.onload = (e: any) => {
				ctx.img = e.target.result;
			};
			reader.readAsDataURL(file);

			const data = new FormData();
			data.append('i', (this as any).os.i.token);
			data.append('file', file);

			if (folder) data.append('folderId', folder);

			const xhr = new XMLHttpRequest();
			xhr.open('POST', apiUrl + '/drive/files/create', true);
			xhr.onload = (e: any) => {
				const driveFile = JSON.parse(e.target.response);

				this.$emit('uploaded', driveFile);

				this.uploads = this.uploads.filter(x => x.id != id);
				this.$emit('change', this.uploads);
			};

			xhr.upload.onprogress = e => {
				if (e.lengthComputable) {
					if (ctx.progress == undefined) ctx.progress = {};
					ctx.progress.max = e.total;
					ctx.progress.value = e.loaded;
				}
			};

			xhr.send(data);
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-uploader
	overflow auto

	&:empty
		display none

	> ol
		display block
		margin 0
		padding 0
		list-style none

		> li
			display block
			margin 8px 0 0 0
			padding 0
			height 36px
			box-shadow 0 -1px 0 rgba($theme-color, 0.1)
			border-top solid 8px transparent

			&:first-child
				margin 0
				box-shadow none
				border-top none

			> .img
				display block
				position absolute
				top 0
				left 0
				width 36px
				height 36px
				background-size cover
				background-position center center

			> .name
				display block
				position absolute
				top 0
				left 44px
				margin 0
				padding 0
				max-width 256px
				font-size 0.8em
				color rgba($theme-color, 0.7)
				white-space nowrap
				text-overflow ellipsis
				overflow hidden

				> [data-fa]
					margin-right 4px

			> .status
				display block
				position absolute
				top 0
				right 0
				margin 0
				padding 0
				font-size 0.8em

				> .initing
					color rgba($theme-color, 0.5)

				> .kb
					color rgba($theme-color, 0.5)

				> .percentage
					display inline-block
					width 48px
					text-align right

					color rgba($theme-color, 0.7)

					&:after
						content '%'

			> progress
				display block
				position absolute
				bottom 0
				right 0
				margin 0
				width calc(100% - 44px)
				height 8px
				background transparent
				border none
				border-radius 4px
				overflow hidden

				&::-webkit-progress-value
					background $theme-color

				&::-webkit-progress-bar
					background rgba($theme-color, 0.1)

			> .progress
				display block
				position absolute
				bottom 0
				right 0
				margin 0
				width calc(100% - 44px)
				height 8px
				border none
				border-radius 4px
				background linear-gradient(
					45deg,
					lighten($theme-color, 30%) 25%,
					$theme-color               25%,
					$theme-color               50%,
					lighten($theme-color, 30%) 50%,
					lighten($theme-color, 30%) 75%,
					$theme-color               75%,
					$theme-color
				)
				background-size 32px 32px
				animation bg 1.5s linear infinite

				&.initing
					opacity 0.3

				@keyframes bg
					from {background-position: 0 0;}
					to   {background-position: -64px 32px;}

</style>
