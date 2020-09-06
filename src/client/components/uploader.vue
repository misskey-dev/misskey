<template>
<div class="mk-uploader">
	<ol v-if="uploads.length > 0">
		<li v-for="ctx in uploads" :key="ctx.id">
			<div class="img" :style="{ backgroundImage: `url(${ ctx.img })` }"></div>
			<div class="top">
				<p class="name"><fa :icon="faSpinner" pulse/>{{ ctx.name }}</p>
				<p class="status">
					<span class="initing" v-if="ctx.progressValue === undefined">{{ $t('waiting') }}<mk-ellipsis/></span>
					<span class="kb" v-if="ctx.progressValue !== undefined">{{ String(Math.floor(ctx.progressValue / 1024)).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') }}<i>KB</i> / {{ String(Math.floor(ctx.progressMax / 1024)).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') }}<i>KB</i></span>
					<span class="percentage" v-if="ctx.progressValue !== undefined">{{ Math.floor((ctx.progressValue / ctx.progressMax) * 100) }}</span>
				</p>
			</div>
			<progress :value="ctx.progressValue" :max="ctx.progressMax" :class="{ initing: ctx.progressValue === undefined, waiting: ctx.progressValue !== undefined && ctx.progressValue === ctx.progressMax }"></progress>
		</li>
	</ol>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { apiUrl } from '@/config';
//import getMD5 from '@/scripts/get-md5';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';

export default defineComponent({
	data() {
		return {
			uploads: [],
			faSpinner
		};
	},
	methods: {
		checkExistence(fileData: ArrayBuffer): Promise<any> {
			return new Promise((resolve, reject) => {
				const data = new FormData();
				data.append('md5', getMD5(fileData));

				os.api('drive/files/find-by-hash', {
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
				const ctx = {
					id: id,
					name: name || file.name || 'untitled',
					progressMax: undefined,
					progressValue: undefined,
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
						ctx.progressMax = e.total;
						ctx.progressValue = e.loaded;
					}
				};

				xhr.send(data);
			}
			reader.readAsArrayBuffer(file);
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-uploader {
  overflow: auto;
}
.mk-uploader:empty {
  display: none;
}
.mk-uploader > ol {
  display: block;
  margin: 0;
  padding: 0;
  list-style: none;
}
.mk-uploader > ol > li {
  display: grid;
  margin: 8px 0 0 0;
  padding: 0;
  height: 36px;
  width: 100%;
  border-top: solid 8px transparent;
  grid-template-columns: 36px calc(100% - 44px);
  grid-template-rows: 1fr 8px;
  column-gap: 8px;
  box-sizing: content-box;
}
.mk-uploader > ol > li:first-child {
  margin: 0;
  box-shadow: none;
  border-top: none;
}
.mk-uploader > ol > li > .img {
  display: block;
  background-size: cover;
  background-position: center center;
  grid-column: 1/2;
  grid-row: 1/3;
}
.mk-uploader > ol > li > .top {
  display: flex;
  grid-column: 2/3;
  grid-row: 1/2;
}
.mk-uploader > ol > li > .top > .name {
  display: block;
  padding: 0 8px 0 0;
  margin: 0;
  font-size: 0.8em;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  flex-shrink: 1;
}
.mk-uploader > ol > li > .top > .name > [data-icon] {
  margin-right: 4px;
}
.mk-uploader > ol > li > .top > .status {
  display: block;
  margin: 0 0 0 auto;
  padding: 0;
  font-size: 0.8em;
  flex-shrink: 0;
}
.mk-uploader > ol > li > .top > .status > .initing {
}
.mk-uploader > ol > li > .top > .status > .kb {
}
.mk-uploader > ol > li > .top > .status > .percentage {
  display: inline-block;
  width: 48px;
  text-align: right;
}
.mk-uploader > ol > li > .top > .status > .percentage:after {
  content: '%';
}
.mk-uploader > ol > li > progress {
  display: block;
  background: transparent;
  border: none;
  border-radius: 4px;
  overflow: hidden;
  grid-column: 2/3;
  grid-row: 2/3;
  z-index: 2;
	width: 100%;
	height: 8px;
}
.mk-uploader > ol > li > progress::-webkit-progress-value {
  background: var(--accent);
}
.mk-uploader > ol > li > progress::-webkit-progress-bar {
  //background: var(--accentAlpha01);
	background: transparent;
}
</style>
