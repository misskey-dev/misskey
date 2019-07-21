<template>
<div>
	<div class="gjisdzwh"
		@dragover.stop="onDragover"
		@dragenter="onDragenter"
		@dragleave="onDragleave"
		@drop.stop="onDrop"
	>
		<div class="content">
			<div class="hashtags" v-if="recentHashtags.length > 0 && $store.state.settings.suggestRecentHashtags">
				<b>{{ $t('@.post-form.recent-tags') }}:</b>
				<a v-for="tag in recentHashtags.slice(0, 5)" @click="addTag(tag)" :title="$t('@.post-form.click-to-tagging')">#{{ tag }}</a>
			</div>
			<div class="with-quote" v-if="quoteId">{{ $t('@.post-form.quote-attached') }} <a @click="quoteId = null">[x]</a></div>
			<div v-if="visibility === 'specified'" class="visibleUsers">
				<span v-for="u in visibleUsers">
					<mk-user-name :user="u"/><a @click="removeVisibleUser(u)">[x]</a>
				</span>
				<a @click="addVisibleUser">{{ $t('@.post-form.add-visible-user') }}</a>
			</div>
			<div class="local-only" v-if="localOnly === true">{{ $t('@.post-form.local-only-message') }}</div>
			<input v-show="useCw" ref="cw" v-model="cw" :placeholder="$t('@.post-form.cw-placeholder')" v-autocomplete="{ model: 'cw' }">
			<div class="textarea">
				<textarea :class="{ with: (files.length != 0 || poll) }"
					ref="text" v-model="text" :disabled="posting"
					@keydown="onKeydown" @paste="onPaste" :placeholder="placeholder"
					v-autocomplete="{ model: 'text' }"
				></textarea>
				<button class="emoji" @click="emoji" ref="emoji">
					<fa :icon="['far', 'laugh']"/>
				</button>
				<x-post-form-attaches class="files" :class="{ with: poll }" :files="files"/>
				<x-poll-editor class="poll-editor" v-if="poll" ref="poll" @destroyed="poll = false" @updated="onPollUpdate()"/>
			</div>
		</div>
		<mk-uploader ref="uploader" @uploaded="attachMedia" @change="onChangeUploadings"/>
		<button class="upload" :title="$t('@.post-form.attach-media-from-local')" @click="chooseFile"><fa icon="upload"/></button>
		<button class="drive" :title="$t('@.post-form.attach-media-from-drive')" @click="chooseFileFromDrive"><fa icon="cloud"/></button>
		<button class="kao" :title="$t('@.post-form.insert-a-kao')" @click="kao"><fa :icon="['far', 'smile']"/></button>
		<button class="poll" :title="$t('@.post-form.create-poll')" @click="poll = !poll"><fa icon="chart-pie"/></button>
		<button class="cw" :title="$t('@.post-form.hide-contents')" @click="useCw = !useCw"><fa :icon="['far', 'eye-slash']"/></button>
		<button class="geo" :title="$t('@.post-form.attach-location-information')" @click="geo ? removeGeo() : setGeo()"><fa icon="map-marker-alt"/></button>
		<button class="visibility" :title="$t('@.post-form.visibility')" @click="setVisibility" ref="visibilityButton">
			<span v-if="visibility === 'public'"><fa icon="globe"/></span>
			<span v-if="visibility === 'home'"><fa icon="home"/></span>
			<span v-if="visibility === 'followers'"><fa icon="unlock"/></span>
			<span v-if="visibility === 'specified'"><fa icon="envelope"/></span>
		</button>
		<p class="text-count" :class="{ over: trimmedLength(text) > maxNoteTextLength }">{{ maxNoteTextLength - trimmedLength(text) }}</p>
		<ui-button primary :wait="posting" class="submit" :disabled="!canPost" @click="post">
			{{ posting ? $t('@.post-form.posting') : submitText }}<mk-ellipsis v-if="posting"/>
		</ui-button>
		<input ref="file" type="file" multiple="multiple" tabindex="-1" @change="onChangeFile"/>
		<div class="dropzone" v-if="draghover"></div>
	</div>
	<details v-if="preview" class="preview" ref="preview" :open="$store.state.device.showPostPreview" @toggle="togglePreview">
		<summary>{{ $t('@.post-form.preview') }}</summary>
		<mk-note class="note" :note="preview" :key="preview.id" :compact="true" :preview="true" />
	</details>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import form from '../../../common/scripts/post-form';

export default Vue.extend({
	i18n: i18n('desktop/views/components/post-form.vue'),

	watch: {
		text() {
			this.doPreview();
		},
		files() {
			this.doPreview();
		},
		visibility() {
			this.doPreview();
		},
		localOnly() {
			this.doPreview();
		},
	},

	mixins: [
		form({
			onSuccess: self => {
				self.$notify(self.renote
					? self.$t('reposted')
					: self.reply
						? self.$t('replied')
						: self.$t('posted'));
			},
			onFailure: self => {
				self.$notify(self.renote
					? self.$t('renote-failed')
					: self.reply
						? self.$t('reply-failed')
						: self.$t('note-failed'));
			}
		}),
	],
});
</script>

<style lang="stylus" scoped>
.gjisdzwh
	display block
	padding 16px
	background var(--desktopPostFormBg)
	overflow hidden

	&:after
		content ""
		display block
		clear both

	> .content
		> input
		> .textarea > textarea
			display block
			width 100%
			padding 12px
			font-size 16px
			color var(--desktopPostFormTextareaFg)
			background var(--desktopPostFormTextareaBg)
			outline none
			border solid 1px var(--primaryAlpha01)
			border-radius 4px
			transition border-color .2s ease
			padding-right 30px

			&:hover
				border-color var(--primaryAlpha02)
				transition border-color .1s ease

			&:focus
				border-color var(--primaryAlpha05)
				transition border-color 0s ease

			&:disabled
				opacity 0.5

			&::-webkit-input-placeholder
				color var(--primaryAlpha03)

		> input
			margin-bottom 8px

		> .textarea
			> .emoji
				position absolute
				top 0
				right 0
				padding 10px
				font-size 18px
				color var(--text)
				opacity 0.5

				&:hover
					color var(--textHighlighted)
					opacity 1

				&:active
					color var(--primary)
					opacity 1

			> textarea
				margin 0
				max-width 100%
				min-width 100%
				min-height 84px

				&:hover
					& + * + *
					& + * + * + *
						border-color var(--primaryAlpha02)
						transition border-color .1s ease

				&:focus
					& + * + *
					& + * + * + *
						border-color var(--primaryAlpha05)
						transition border-color 0s ease

					& + .emoji
						opacity 0.7

				&.with
					border-bottom solid 1px var(--primaryAlpha01) !important
					border-radius 4px 4px 0 0

			> .files
				margin 0
				padding 0
				background var(--desktopPostFormTextareaBg)
				border solid 1px var(--primaryAlpha01)
				border-top none
				border-radius 0 0 4px 4px
				transition border-color .3s ease

				&.with
					border-bottom solid 1px var(--primaryAlpha01) !important
					border-radius 0

			> .poll-editor
				background var(--desktopPostFormTextareaBg)
				border solid 1px var(--primaryAlpha01)
				border-top none
				border-radius 0 0 4px 4px
				transition border-color .3s ease

		> .hashtags
			margin 0 0 8px 0
			overflow hidden
			white-space nowrap
			font-size 14px

			> b
				color var(--primary)

			> *
				margin-right 8px
				white-space nowrap

		> .with-quote
			margin 0 0 8px 0
			color var(--primary)

		> .visibleUsers
			margin-bottom 8px
			font-size 14px

			> span
				margin-right 16px
				color var(--primary)

		> .local-only
			margin 0 0 8px 0
			color var(--primary)

	> .mk-uploader
		margin 8px 0 0 0
		padding 8px
		border solid 1px var(--primaryAlpha02)
		border-radius 4px

	input[type='file']
		display none

	.submit
		display block
		position absolute
		bottom 16px
		right 16px
		width 110px
		height 40px

	> .text-count
		pointer-events none
		display block
		position absolute
		bottom 16px
		right 138px
		margin 0
		line-height 40px
		color var(--primaryAlpha05)

		&.over
			color #ec3828

	> .upload
	> .drive
	> .kao
	> .poll
	> .cw
	> .geo
	> .visibility
		display inline-block
		cursor pointer
		padding 0
		margin 8px 4px 0 0
		width 40px
		height 40px
		font-size 1em
		color var(--desktopPostFormTransparentButtonFg)
		background transparent
		outline none
		border solid 1px transparent
		border-radius 4px

		&:hover
			background transparent
			border-color var(--primaryAlpha03)

		&:active
			color var(--primaryAlpha06)
			background linear-gradient(to bottom, var(--desktopPostFormTransparentButtonActiveGradientStart) 0%, var(--desktopPostFormTransparentButtonActiveGradientEnd) 100%)
			border-color var(--primaryAlpha05)
			box-shadow 0 2px 4px rgba(#000, 0.15) inset

		&:focus
			&:after
				content ""
				pointer-events none
				position absolute
				top -5px
				right -5px
				bottom -5px
				left -5px
				border 2px solid var(--primaryAlpha03)
				border-radius 8px

	> .dropzone
		position absolute
		left 0
		top 0
		width 100%
		height 100%
		border dashed 2px var(--primaryAlpha05)
		pointer-events none

.preview
	background var(--desktopPostFormBg)

	> summary
		padding 0px 16px 16px 20px
		font-size 14px
		color var(--text)

	> .note
		border-top solid var(--lineWidth) var(--faceDivider)

</style>
