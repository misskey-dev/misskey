<template>
<x-popup :source="source" ref="popup" @closed="() => { $emit('closed'); destroyDom(); }" v-hotkey.global="keymap">
	<div class="rdfaahpb">
		<div class="buttons" ref="buttons" :class="{ showFocus }">
			<button class="_button" v-for="(reaction, i) in rs" :key="reaction" @click="react(reaction)" :tabindex="i + 1" :title="reaction" v-particle><x-reaction-icon :reaction="reaction"/></button>
		</div>
		<input class="text" v-model="text" :placeholder="$t('enterEmoji')" @keyup.enter="reactText" @input="tryReactText" v-autocomplete="{ model: 'text' }">
	</div>
</x-popup>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import { emojiRegex } from '../../misc/emoji-regex';
import XReactionIcon from './reaction-icon.vue';
import XPopup from './popup.vue';

export default Vue.extend({
	i18n,

	components: {
		XPopup,
		XReactionIcon,
	},

	props: {
		source: {
			required: true
		},

		reactions: {
			required: false
		},

		showFocus: {
			type: Boolean,
			required: false,
			default: false
		},
	},

	data() {
		return {
			rs: this.reactions || this.$store.state.settings.reactions,
			text: null,
			focus: null
		};
	},

	computed: {
		keymap(): any {
			return {
				'esc': this.close,
				'enter|space|plus': this.choose,
				'up|k': this.focusUp,
				'left|h|shift+tab': this.focusLeft,
				'right|l|tab': this.focusRight,
				'down|j': this.focusDown,
				'1': () => this.react(this.rs[0]),
				'2': () => this.react(this.rs[1]),
				'3': () => this.react(this.rs[2]),
				'4': () => this.react(this.rs[3]),
				'5': () => this.react(this.rs[4]),
				'6': () => this.react(this.rs[5]),
				'7': () => this.react(this.rs[6]),
				'8': () => this.react(this.rs[7]),
				'9': () => this.react(this.rs[8]),
				'0': () => this.react(this.rs[9]),
			};
		},
	},

	watch: {
		focus(i) {
			this.$refs.buttons.children[i].focus();
		}
	},

	mounted() {
		this.focus = 0;
	},

	methods: {
		close() {
			this.$refs.popup.close();
		},
	
		react(reaction) {
			this.$emit('chosen', reaction);
		},

		reactText() {
			if (!this.text) return;
			this.react(this.text);
		},

		tryReactText() {
			if (!this.text) return;
			if (!this.text.match(emojiRegex)) return;
			this.reactText();
		},

		focusUp() {
			this.focus = this.focus == 0 ? 9 : this.focus < 5 ? (this.focus + 4) : (this.focus - 5);
		},

		focusDown() {
			this.focus = this.focus == 9 ? 0 : this.focus >= 5 ? (this.focus - 4) : (this.focus + 5);
		},

		focusRight() {
			this.focus = this.focus == 9 ? 0 : (this.focus + 1);
		},

		focusLeft() {
			this.focus = this.focus == 0 ? 9 : (this.focus - 1);
		},

		choose() {
			this.$refs.buttons.children[this.focus].click();
		},
	}
});
</script>

<style lang="scss" scoped>
.rdfaahpb {
	> .buttons {
		padding: 6px 6px 0 6px;
		width: 212px;
		box-sizing: border-box;
		text-align: center;

		@media (max-width: 1025px) {
			padding: 8px 8px 0 8px;
			width: 256px;
		}

		&.showFocus {
			> button:focus {
				z-index: 1;

				&:after {
					content: "";
					pointer-events: none;
					position: absolute;
					top: 0;
					right: 0;
					bottom: 0;
					left: 0;
					border: 2px solid var(--focus);
					border-radius: 4px;
				}
			}
		}

		> button {
			padding: 0;
			width: 40px;
			height: 40px;
			font-size: 24px;
			border-radius: 2px;

			@media (max-width: 1025px) {
				width: 48px;
				height: 48px;
				font-size: 26px;
			}

			> * {
				height: 1em;
			}

			&:hover {
				background: rgba(0, 0, 0, 0.05);
			}

			&:active {
				background: var(--accent);
				box-shadow: inset 0 0.15em 0.3em rgba(27, 31, 35, 0.15);
			}
		}
	}

	> .text {
		width: 208px;
		padding: 8px;
		margin: 0 0 6px 0;
		box-sizing: border-box;
		text-align: center;
		font-size: 16px;
		outline: none;
		border: none;
		background: transparent;
		color: var(--fg);

		@media (max-width: 1025px) {
			width: 256px;
			margin: 4px 0 8px 0;
		}
	}
}
</style>
