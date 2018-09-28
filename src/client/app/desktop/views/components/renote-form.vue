<template>
<div class="mk-renote-form">
	<mk-note-preview class="preview" :note="note"/>
	<template v-if="!quote">
		<footer>
			<a class="quote" v-if="!quote" @click="onQuote">%i18n:@quote%</a>
			<ui-button class="button cancel" inline @click="cancel">%i18n:@cancel%</ui-button>
			<ui-button class="button ok" inline primary @click="ok" :disabled="wait">{{ wait ? '%i18n:@reposting%' : '%i18n:@renote%' }}</ui-button>
		</footer>
	</template>
	<template v-if="quote">
		<mk-post-form ref="form" :renote="note" @posted="onChildFormPosted"/>
	</template>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['note'],
	data() {
		return {
			wait: false,
			quote: false
		};
	},
	methods: {
		ok() {
			this.wait = true;
			(this as any).api('notes/create', {
				renoteId: this.note.id
			}).then(data => {
				this.$emit('posted');
				(this as any).apis.notify('%i18n:@success%');
			}).catch(err => {
				(this as any).apis.notify('%i18n:@failure%');
			}).then(() => {
				this.wait = false;
			});
		},
		cancel() {
			this.$emit('canceled');
		},
		onQuote() {
			this.quote = true;

			this.$nextTick(() => {
				(this.$refs.form as any).focus();
			});
		},
		onChildFormPosted() {
			this.$emit('posted');
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-renote-form
	> .preview
		margin 16px 22px

	> footer
		height 72px
		background var(--desktopRenoteFormFooter)

		> .quote
			position absolute
			bottom 16px
			left 28px
			line-height 40px

		> .button
			display block
			position absolute
			bottom 16px
			width 120px
			height 40px

			&.cancel
				right 148px

			&.ok
				right 16px

</style>
