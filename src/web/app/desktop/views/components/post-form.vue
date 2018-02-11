<template>
<div class="mk-post-form"
	@dragover="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop="onDrop"
>
	<div class="content">
		<textarea :class="{ with: (files.length != 0 || poll) }" ref="text" :disabled="wait"
			@keydown="onKeydown" @paste="onPaste" :placeholder="placeholder"
		></textarea>
		<div class="medias" :class="{ with: poll }" v-show="files.length != 0">
			<ul ref="media">
				<li each={ files } data-id={ id }>
					<div class="img" style="background-image: url({ url + '?thumbnail&size=64' })" title={ name }></div>
					<img class="remove" @click="removeFile" src="/assets/desktop/remove.png" title="%i18n:desktop.tags.mk-post-form.attach-cancel%" alt=""/>
				</li>
			</ul>
			<p class="remain">{ 4 - files.length }/4</p>
		</div>
		<mk-poll-editor v-if="poll" ref="poll" ondestroy={ onPollDestroyed }/>
	</div>
	<mk-uploader ref="uploader"/>
	<button ref="upload" title="%i18n:desktop.tags.mk-post-form.attach-media-from-local%" @click="selectFile">%fa:upload%</button>
	<button ref="drive" title="%i18n:desktop.tags.mk-post-form.attach-media-from-drive%" @click="selectFileFromDrive">%fa:cloud%</button>
	<button class="kao" title="%i18n:desktop.tags.mk-post-form.insert-a-kao%" @click="kao">%fa:R smile%</button>
	<button class="poll" title="%i18n:desktop.tags.mk-post-form.create-poll%" @click="addPoll">%fa:chart-pie%</button>
	<p class="text-count { over: refs.text.value.length > 1000 }">{ '%i18n:desktop.tags.mk-post-form.text-remain%'.replace('{}', 1000 - refs.text.value.length) }</p>
	<button :class="{ wait: wait }" ref="submit" disabled={ wait || (refs.text.value.length == 0 && files.length == 0 && !poll　&& !repost) } @click="post">
		{ wait ? '%i18n:desktop.tags.mk-post-form.posting%' : submitText }<mk-ellipsis v-if="wait"/>
	</button>
	<input ref="file" type="file" accept="image/*" multiple="multiple" tabindex="-1" onchange={ changeFile }/>
	<div class="dropzone" v-if="draghover"></div>
</div>
</template>
