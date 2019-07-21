<template>
<div class="gafaadew">
	<div class="form"
		@dragover.stop="onDragover"
		@dragenter="onDragenter"
		@dragleave="onDragleave"
		@drop.stop="onDrop"
	>
		<header>
			<button class="cancel" @click="cancel"><fa icon="times"/></button>
			<div>
				<span class="text-count" :class="{ over: trimmedLength(text) > maxNoteTextLength }">{{ maxNoteTextLength - trimmedLength(text) }}</span>
				<span class="geo" v-if="geo"><fa icon="map-marker-alt"/></span>
				<button class="submit" :disabled="!canPost" @click="post">{{ submitText }}</button>
			</div>
		</header>
		<div class="form">
			<mk-note-preview class="preview" v-if="reply" :note="reply"/>
			<mk-note-preview class="preview" v-if="renote" :note="renote"/>
			<div class="with-quote" v-if="quoteId">{{ $t('@.post-form.quote-attached') }} <a @click="quoteId = null">[x]</a></div>
			<div v-if="visibility === 'specified'" class="visibleUsers">
				<span v-for="u in visibleUsers">
					<mk-user-name :user="u"/>
					<a @click="removeVisibleUser(u)">[x]</a>
				</span>
				<a @click="addVisibleUser">+{{ $t('@.post-form.add-visible-user') }}</a>
			</div>
			<div class="local-only" v-if="localOnly === true">{{ $t('@.post-form.local-only-message') }}</div>
			<input v-show="useCw" ref="cw" v-model="cw" :placeholder="$t('@.post-form.cw-placeholder')" v-autocomplete="{ model: 'cw' }">
			<textarea v-model="text" ref="text" :disabled="posting" :placeholder="placeholder" v-autocomplete="{ model: 'text' }" @paste="onPaste"></textarea>
			<x-post-form-attaches class="attaches" :files="files"/>
			<x-poll-editor v-if="poll" ref="poll" @destroyed="poll = false" @updated="onPollUpdate()"/>
			<mk-uploader ref="uploader" @uploaded="attachMedia" @change="onChangeUploadings"/>
			<footer>
				<button class="upload" @click="chooseFile"><fa icon="upload"/></button>
				<button class="drive" @click="chooseFileFromDrive"><fa icon="cloud"/></button>
				<button class="kao" @click="kao"><fa :icon="['far', 'smile']"/></button>
				<button class="poll" @click="poll = true"><fa icon="chart-pie"/></button>
				<button class="poll" @click="useCw = !useCw"><fa :icon="['far', 'eye-slash']"/></button>
				<button class="geo" @click="geo ? removeGeo() : setGeo()"><fa icon="map-marker-alt"/></button>
				<button class="visibility" @click="setVisibility" ref="visibilityButton">
					<span v-if="visibility === 'public'"><fa icon="globe"/></span>
					<span v-if="visibility === 'home'"><fa icon="home"/></span>
					<span v-if="visibility === 'followers'"><fa icon="unlock"/></span>
					<span v-if="visibility === 'specified'"><fa icon="envelope"/></span>
				</button>
			</footer>
			<input ref="file" class="file" type="file" multiple="multiple" @change="onChangeFile"/>
		</div>
	</div>
	<div class="hashtags" v-if="recentHashtags.length > 0 && $store.state.settings.suggestRecentHashtags">
		<a v-for="tag in recentHashtags.slice(0, 5)" @click="addTag(tag)">#{{ tag }}</a>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import form from '../../../common/scripts/post-form';

export default Vue.extend({
	i18n: i18n(),

	mixins: [
		form({
			mobile: true
		}),
	],

	methods: {
		cancel() {
			this.$emit('cancel');
		},
	}
});
</script>

<style lang="stylus" scoped>
.gafaadew
	max-width 500px
	width calc(100% - 16px)
	margin 8px auto

	@media (min-width 500px)
		margin 16px auto
		width calc(100% - 32px)

		> .form
			box-shadow 0 8px 32px rgba(#000, 0.1)

	@media (min-width 600px)
		margin 32px auto

	> .form
		background var(--face)
		border-radius 8px
		box-shadow 0 0 2px rgba(#000, 0.1)

		> header
			z-index 1000
			height 50px
			box-shadow 0 1px 0 0 var(--mobilePostFormDivider)

			> .cancel
				padding 0
				width 50px
				line-height 50px
				font-size 24px
				color var(--text)

			> div
				position absolute
				top 0
				right 0
				color var(--text)

				> .text-count
					line-height 50px

				> .geo
					margin 0 8px
					line-height 50px

				> .submit
					margin 8px
					padding 0 16px
					line-height 34px
					vertical-align bottom
					color var(--primaryForeground)
					background var(--primary)
					border-radius 4px

					&:disabled
						opacity 0.7

		> .form
			max-width 500px
			margin 0 auto

			> .preview
				padding 16px

			> .with-quote
				margin 0 0 8px 0
				color var(--primary)

			> .visibleUsers
				margin 5px
				font-size 14px

				> span
					margin-right 16px
					color var(--text)

			> .local-only
				margin 0 0 8px 0
				color var(--primary)

			> input
				z-index 1

			> input
			> textarea
				display block
				padding 12px
				margin 0
				width 100%
				font-size 16px
				color var(--inputText)
				background var(--mobilePostFormTextareaBg)
				border none
				border-radius 0
				box-shadow 0 1px 0 0 var(--mobilePostFormDivider)

				&:disabled
					opacity 0.5

			> textarea
				max-width 100%
				min-width 100%
				min-height 80px

			> .mk-uploader
				margin 8px 0 0 0
				padding 8px

			> .file
				display none

			> footer
				white-space nowrap
				overflow auto
				-webkit-overflow-scrolling touch
				overflow-scrolling touch

				> *
					display inline-block
					padding 0
					margin 0
					width 48px
					height 48px
					font-size 20px
					color var(--mobilePostFormButton)
					background transparent
					outline none
					border none
					border-radius 0
					box-shadow none

	> .hashtags
		margin 8px

		> *
			margin-right 8px

</style>
