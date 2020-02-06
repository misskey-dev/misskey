<template>
<x-popup :source="source" ref="popup" @closed="() => { $emit('closed'); destroyDom(); }" v-hotkey.global="keymap">
	<div class="rdfaahpc">
		<button class="_button" @click="quote()"><fa :icon="faQuoteRight"/></button>
		<button class="_button" @click="renote()"><fa :icon="faRetweet"/></button>
	</div>
</x-popup>
</template>

<script lang="ts">
import Vue from 'vue';
import { faQuoteRight, faRetweet } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';
import XPopup from './popup.vue';

export default Vue.extend({
	i18n,

	components: {
		XPopup,
	},

	props: {
		note: {
			type: Object,
			required: true
		},

		source: {
			required: true
		},
	},

	data() {
		return {
			faQuoteRight, faRetweet
		};
	},

	computed: {
		keymap(): any {
			return {
				'esc': this.close,
			};
		}
	},

	methods: {
		renote() {
			(this as any).$root.api('notes/create', {
				renoteId: this.note.id
			}).then(() => {
				this.$emit('closed');
				this.destroyDom();
			});
		},

		quote() {
			this.$emit('closed');
			this.destroyDom();
			this.$root.post({
				renote: this.note,
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.rdfaahpc {
	padding: 4px;

	> button {
		padding: 0;
		width: 40px;
		height: 40px;
		font-size: 16px;
		border-radius: 2px;

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
</style>
