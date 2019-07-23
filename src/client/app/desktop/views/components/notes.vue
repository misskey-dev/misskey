<template>
<div class="mk-notes" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
	<slot name="header"></slot>

	<div class="newer-indicator" :style="{ top: $store.state.uiHeaderHeight + 'px' }" v-show="queue.length > 0"></div>

	<div class="empty" v-if="empty">{{ $t('@.no-notes') }}</div>

	<mk-error v-if="error" @retry="init()"/>

	<div class="placeholder" v-if="fetching">
		<template v-for="i in 10">
			<mk-note-skeleton :key="i"/>
		</template>
	</div>

	<!-- トランジションを有効にするとなぜかメモリリークする -->
	<component :is="!$store.state.device.reduceMotion ? 'transition-group' : 'div'" name="mk-notes" class="notes transition" tag="div" ref="notes">
		<template v-for="(note, i) in _notes">
			<mk-note :note="note" :key="note.id" :compact="true" ref="note"/>
			<p class="date" :key="note.id + '_date'" v-if="i != items.length - 1 && note._date != _notes[i + 1]._date">
				<span><fa icon="angle-up"/>{{ note._datetext }}</span>
				<span><fa icon="angle-down"/>{{ _notes[i + 1]._datetext }}</span>
			</p>
		</template>
	</component>

	<footer v-if="more">
		<button @click="fetchMore()" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }">
			<template v-if="!moreFetching">{{ $t('@.load-more') }}</template>
			<template v-if="moreFetching"><fa icon="spinner" pulse fixed-width/></template>
		</button>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import * as config from '../../../config';
import shouldMuteNote from '../../../common/scripts/should-mute-note';
import paging from '../../../common/scripts/paging';

export default Vue.extend({
	i18n: i18n(),

	mixins: [
		paging({
			captureWindowScroll: true,

			onQueueChanged: (self, x) => {
				if (x.length > 0) {
					self.$store.commit('indicate', true);
				} else {
					self.$store.commit('indicate', false);
				}
			},

			onPrepend: (self, note, silent) => {
				// 弾く
				if (shouldMuteNote(self.$store.state.i, self.$store.state.settings, note)) return false;

				// タブが非表示またはスクロール位置が最上部ではないならタイトルで通知
				if (document.hidden || !self.isScrollTop()) {
					self.$store.commit('pushBehindNote', note);
				}

				if (self.isScrollTop()) {
					// サウンドを再生する
					if (self.$store.state.device.enableSounds && self.$store.state.device.enableSoundsInTimeline && !silent) {
						const sound = new Audio(`${config.url}/assets/post.mp3`);
						sound.volume = self.$store.state.device.soundVolume;
						sound.play();
					}
				}
			},

			onInited: (self) => {
				self.$emit('loaded');
			}
		}),
	],

	props: {
		pagination: {
			required: true
		},
	},

	computed: {
		_notes(): any[] {
			return (this.items as any).map(item => {
				const date = new Date(item.createdAt).getDate();
				const month = new Date(item.createdAt).getMonth() + 1;
				item._date = date;
				item._datetext = this.$t('@.month-and-day').replace('{month}', month.toString()).replace('{day}', date.toString());
				return item;
			});
		}
	},

	methods: {
		focus() {
			(this.$refs.notes as any).children[0].focus ? (this.$refs.notes as any).children[0].focus() : (this.$refs.notes as any).$el.children[0].focus();
		},
	}
});
</script>

<style lang="stylus" scoped>
.mk-notes
	background var(--face)
	overflow hidden

	&.round
		border-radius 6px

	&.shadow
		box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)

	.transition
		.mk-notes-enter
		.mk-notes-leave-to
			opacity 0
			transform translateY(-30px)

		> *
			transition transform .3s ease, opacity .3s ease

	> .empty
		padding 16px
		text-align center
		color var(--text)

	> .placeholder
		padding 32px
		opacity 0.3

	> .notes
		> .date
			display block
			margin 0
			line-height 32px
			font-size 14px
			text-align center
			color var(--dateDividerFg)
			background var(--dateDividerBg)
			border-bottom solid var(--lineWidth) var(--faceDivider)

			span
				margin 0 16px

			[data-icon]
				margin-right 8px

	> .newer-indicator
		position -webkit-sticky
		position sticky
		z-index 100
		height 3px
		background var(--primary)

	> footer
		> button
			display block
			margin 0
			padding 16px
			width 100%
			text-align center
			color #ccc
			background var(--face)
			border-top solid var(--lineWidth) var(--faceDivider)
			border-bottom-left-radius 6px
			border-bottom-right-radius 6px

			&:hover
				box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.05)

			&:active
				box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.1)

</style>
