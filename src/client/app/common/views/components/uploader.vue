<template>
<div class="mk-uploader">
	<ol v-if="uploads.length > 0">
		<li v-for="ctx in uploads" :key="ctx.id">
			<div class="img" :style="{ backgroundImage: `url(${ ctx.img })` }"></div>
			<div class="top">
				<p class="name"><fa icon="spinner" pulse/>{{ ctx.name }}</p>
				<p class="status">
					<span class="initing" v-if="ctx.progress == undefined">{{ $t('waiting') }}<mk-ellipsis/></span>
					<span class="kb" v-if="ctx.progress != undefined">{{ String(Math.floor(ctx.progress.value / 1024)).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') }}<i>KB</i> / {{ String(Math.floor(ctx.progress.max / 1024)).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') }}<i>KB</i></span>
					<span class="percentage" v-if="ctx.progress != undefined">{{ Math.floor((ctx.progress.value / ctx.progress.max) * 100) }}</span>
				</p>
			</div>
			<progress v-if="ctx.progress != undefined && ctx.progress.value != ctx.progress.max" :value="ctx.progress.value" :max="ctx.progress.max"></progress>
			<div class="progress initing" v-if="ctx.progress == undefined"></div>
			<div class="progress waiting" v-if="ctx.progress != undefined && ctx.progress.value == ctx.progress.max"></div>
		</li>
	</ol>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { apiUrl } from '../../../config';
import getMD5 from '../../scripts/get-md5';

export default Vue.extend({
	i18n: i18n('common/views/components/uploader.vue'),
	data() {
		return {
			uploads: []
		};
	},
	methods: {
		checkExistence(fileData: ArrayBuffer): Promise<any> {
			return new Promise((resolve, reject) => {
				const data = new FormData();
				data.append('md5', getMD5(fileData));

				this.$root.api('drive/files/find-by-hash', {
					md5: getMD5(fileData)
				}).then(resp => {
					resolve(resp.length > 0 ? resp[0] : null);
				});
			});
		},

		upload(file: File, folder: any, name?: string) {
			if (folder && typeof folder == 'object') folder = folder.id;

			const id = Math.random();

			const reader = new FileReader();
			reader.onload = (e: any) => {
				this.checkExistence(e.target.result).then(result => {
					if (result !== null) {
						this.$emit('uploaded', result);
						return;
					}

					const ctx = {
						id: id,
						name: name || file.name || 'untitled',
						progress: undefined,
						img: window.URL.createObjectURL(file)
					};

					this.uploads.push(ctx);
					this.$emit('change', this.uploads);

					const data = new FormData();
					data.append('i', this.$store.state.i.token);
					data.append('force', 'true');
					data.append('file', file);

					if (folder) data.append('folderId', folder);
					if (name) data.append('name', name);

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
				})
			}
			reader.readAsArrayBuffer(file);
		}
	}
});
</script>

<style lang="stylus" scoped>
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
			display grid
			margin 8px 0 0 0
			padding 0
			height 36px
			width: 100%
			box-shadow 0 -1px 0 var(--primaryAlpha01)
			border-top solid 8px transparent
			grid-template-columns 36px calc(100% - 44px)
			grid-template-rows 1fr 8px
			column-gap 8px
			box-sizing content-box

			&:first-child
				margin 0
				box-shadow none
				border-top none

			> .img
				display block
				background-size cover
				background-position center center
				grid-column 1 / 2
				grid-row 1 / 3

			> .top
				display flex
				grid-column 2 / 3
				grid-row 1 / 2

				> .name
					display block
					padding 0 8px 0 0
					margin 0
					font-size 0.8em
					color var(--primaryAlpha07)
					white-space nowrap
					text-overflow ellipsis
					overflow hidden
					flex-shrink 1

					> [data-icon]
						margin-right 4px

				> .status
					display block
					margin 0 0 0 auto
					padding 0
					font-size 0.8em
					flex-shrink 0

					> .initing
						color var(--primaryAlpha05)

					> .kb
						color var(--primaryAlpha05)

					> .percentage
						display inline-block
						width 48px
						text-align right

						color var(--primaryAlpha07)

						&:after
							content '%'

			> progress
				display block
				background transparent
				border none
				border-radius 4px
				overflow hidden
				grid-column 2 / 3
				grid-row 2 / 3
				z-index 2

				&::-webkit-progress-value
					background var(--primary)

				&::-webkit-progress-bar
					background var(--primaryAlpha01)

			> .progress
				display block
				border none
				border-radius 4px
				background linear-gradient(
					45deg,
					var(--primaryLighten30) 25%,
					var(--primary)               25%,
					var(--primary)               50%,
					var(--primaryLighten30) 50%,
					var(--primaryLighten30) 75%,
					var(--primary)               75%,
					var(--primary)
				)
				background-size 32px 32px
				animation bg 1.5s linear infinite
				grid-column 2 / 3
				grid-row 2 / 3
				z-index 1

				&.initing
					opacity 0.3

				@keyframes bg
					from {background-position: 0 0;}
					to   {background-position: -64px 32px;}

</style>
