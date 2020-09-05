<template>
<DeckUI v-if="deckmode"/>
<DefaultUI v-else/>

<XDialog v-if="dialog" v-bind="dialog" :key="dialog.id"
	@done="onDialogDone" @closed="onDialogClosed"/>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import DefaultUI from './default.vue';
import DeckUI from './deck.vue';
import { instanceName, deckmode } from './config';

export default defineComponent({
	components: {
		DefaultUI,
		DeckUI,
		XDialog: defineAsyncComponent(() => import('./components/dialog.vue')),
	},

	metaInfo: {
		title: null,
		titleTemplate: title => title ? `${title} | ${(instanceName || 'Misskey')}` : (instanceName || 'Misskey')
	},

	props: {
		// TODO: propで渡すとvueによって無駄なobserveがされるのでどうにかする
		stream: {

		},
		isMobile: {
			type: Boolean,
			required: false,
			default: false,
		}
	},

	data() {
		return {
			deckmode
		};
	},

	computed: {
		dialog() {
			if (this.$store.state.dialogs.length === 0) return null;

			// what: ダイアログが複数ある場合は、一番最後に追加されたダイアログを表示する
			// why: ダイアログが一度に複数表示されるとユーザビリティが悪いため。
			return this.$store.state.dialogs[this.$store.state.dialogs.length - 1];
		}
	},

	methods: {
		api(endpoint: string, data: Record<string, any> = {}, token?) {
			return this.$store.dispatch('api', { endpoint, data, token });
		},

		onDialogDone(result) {
			this.$store.commit('dialogDone', { id: this.dialog.id, result });
		},

		onDialogClosed() {
			this.$store.commit('removeDialog', this.dialog.id);
		}
	}
});
</script>
