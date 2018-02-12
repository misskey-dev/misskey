<template>
<div class="mk-post-form"
	@dragover="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop="onDrop"
>
	<div class="content">
		<textarea :class="{ with: (files.length != 0 || poll) }" ref="text" :disabled="posting"
			@keydown="onKeydown" @paste="onPaste" :placeholder="placeholder"
		></textarea>
		<div class="medias" :class="{ with: poll }" v-show="files.length != 0">
			<ul ref="media">
				<li v-for="file in files" :key="file.id">
					<div class="img" :style="{ backgroundImage: `url(${file.url}?thumbnail&size=64)` }" :title="file.name"></div>
					<img class="remove" @click="removeFile(file.id)" src="/assets/desktop/remove.png" title="%i18n:desktop.tags.mk-post-form.attach-cancel%" alt=""/>
				</li>
			</ul>
			<p class="remain">{{ 4 - files.length }}/4</p>
		</div>
		<mk-poll-editor v-if="poll" ref="poll" @destroyed="onPollDestroyed"/>
	</div>
	<mk-uploader ref="uploader"/>
	<button ref="upload" title="%i18n:desktop.tags.mk-post-form.attach-media-from-local%" @click="selectFile">%fa:upload%</button>
	<button ref="drive" title="%i18n:desktop.tags.mk-post-form.attach-media-from-drive%" @click="selectFileFromDrive">%fa:cloud%</button>
	<button class="kao" title="%i18n:desktop.tags.mk-post-form.insert-a-kao%" @click="kao">%fa:R smile%</button>
	<button class="poll" title="%i18n:desktop.tags.mk-post-form.create-poll%" @click="addPoll">%fa:chart-pie%</button>
	<p class="text-count { over: refs.text.value.length > 1000 }">{ '%i18n:desktop.tags.mk-post-form.text-remain%'.replace('{}', 1000 - refs.text.value.length) }</p>
	<button :class="{ posting }" ref="submit" :disabled="!canPost" @click="post">
		{ posting ? '%i18n:desktop.tags.mk-post-form.posting%' : submitText }<mk-ellipsis v-if="posting"/>
	</button>
	<input ref="file" type="file" accept="image/*" multiple="multiple" tabindex="-1" onchange={ changeFile }/>
	<div class="dropzone" v-if="draghover"></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			posting: false,

		};
	},
	computed: {
		canPost(): boolean {
			return !this.posting && (refs.text.value.length != 0 || files.length != 0 || poll || repost);
		}
	}
});
</script>

