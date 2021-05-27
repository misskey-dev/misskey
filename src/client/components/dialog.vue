<template>
<MkModal ref="modal" @click="done(true)" @closed="$emit('closed')">
	<div class="mk-dialog">
		<div class="icon" v-if="icon">
			<i :class="icon"></i>
		</div>
		<div class="icon" v-else-if="!input && !select" :class="type">
			<i v-if="type === 'success'" class="fas fa-check"></i>
			<i v-else-if="type === 'error'" class="fas fa-times-circle"></i>
			<i v-else-if="type === 'warning'" class="fas fa-exclamation-triangle"></i>
			<i v-else-if="type === 'info'" class="fas fa-info-circle"></i>
			<i v-else-if="type === 'question'" class="fas fa-question-circle"></i>
			<i v-else-if="type === 'waiting'" class="fas fa-spinner fa-pulse"></i>
		</div>
		<header v-if="title"><Mfm :text="title"/></header>
		<div class="body" v-if="text"><Mfm :text="text"/></div>
		<MkInput v-if="input && !input.multiline" v-model:value="inputValue" autofocus :type="input.type || 'text'" :placeholder="input.placeholder" @keydown="onInputKeydown"></MkInput>
		<textarea v-else-if="input && input.multiline" v-model="inputValue" :placeholder="input.placeholder" @keydown="onInputKeydown"></textarea>
		<MkSelect v-if="select" v-model:value="selectedValue" autofocus>
			<template v-if="select.items">
				<option v-for="item in select.items" :value="item.value">{{ item.text }}</option>
			</template>
			<template v-else>
				<optgroup v-for="groupedItem in select.groupedItems" :label="groupedItem.label">
					<option v-for="item in groupedItem.items" :value="item.value">{{ item.text }}</option>
				</optgroup>
			</template>
		</MkSelect>
		<div class="buttons" v-if="(showOkButton || showCancelButton) && !actions">
			<MkButton inline @click="ok" v-if="showOkButton" primary :autofocus="!input && !select">{{ (showCancelButton || input || select) ? $ts.ok : $ts.gotIt }}</MkButton>
			<MkButton inline @click="cancel" v-if="showCancelButton || input || select">{{ $ts.cancel }}</MkButton>
		</div>
		<div class="buttons" v-if="actions">
			<MkButton v-for="action in actions" inline @click="() => { action.callback(); close(); }" :primary="action.primary" :key="action.text">{{ action.text }}</MkButton>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkModal from '@client/components/ui/modal.vue';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import MkSelect from '@client/components/ui/select.vue';

export default defineComponent({
	components: {
		MkModal,
		MkButton,
		MkInput,
		MkSelect,
	},

	props: {
		type: {
			type: String,
			required: false,
			default: 'info'
		},
		title: {
			type: String,
			required: false
		},
		text: {
			type: String,
			required: false
		},
		input: {
			required: false
		},
		select: {
			required: false
		},
		icon: {
			required: false
		},
		actions: {
			required: false
		},
		showOkButton: {
			type: Boolean,
			default: true
		},
		showCancelButton: {
			type: Boolean,
			default: false
		},
		cancelableByBgClick: {
			type: Boolean,
			default: true
		},
	},

	emits: ['done', 'closed'],

	data() {
		return {
			inputValue: this.input && this.input.default ? this.input.default : null,
			selectedValue: this.select ? this.select.default ? this.select.default : this.select.items ? this.select.items[0].value : this.select.groupedItems[0].items[0].value : null,
		};
	},

	mounted() {
		document.addEventListener('keydown', this.onKeydown);
	},

	beforeUnmount() {
		document.removeEventListener('keydown', this.onKeydown);
	},

	methods: {
		done(canceled, result?) {
			this.$emit('done', { canceled, result });
			this.$refs.modal.close();
		},

		async ok() {
			if (!this.showOkButton) return;

			const result =
				this.input ? this.inputValue :
				this.select ? this.selectedValue :
				true;
			this.done(false, result);
		},

		cancel() {
			this.done(true);
		},

		onBgClick() {
			if (this.cancelableByBgClick) {
				this.cancel();
			}
		},

		onKeydown(e) {
			if (e.which === 27) { // ESC
				this.cancel();
			}
		},

		onInputKeydown(e) {
			if (e.which === 13) { // Enter
				if (this.input && (!this.input.multiline || e.ctrlKey)) {
					e.preventDefault();
					e.stopPropagation();
					this.ok();
				}
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-dialog {
	position: relative;
	padding: 32px;
	min-width: 320px;
	max-width: 480px;
	box-sizing: border-box;
	text-align: center;
	background: var(--panel);
	border-radius: var(--radius);

	> .icon {
		font-size: 32px;

		&.success {
			color: var(--success);
		}

		&.error {
			color: var(--error);
		}

		&.warning {
			color: var(--warn);
		}

		> * {
			display: block;
			margin: 0 auto;
		}

		& + header {
			margin-top: 16px;
		}
	}

	> header {
		margin: 0 0 8px 0;
		font-weight: bold;
		font-size: 20px;

		& + .body {
			margin-top: 8px;
		}
	}

	> .body {
		margin: 16px 0 0 0;
	}

	> .buttons {
		margin-top: 16px;

		> * {
			margin: 0 8px;
		}
	}

	> textarea {
		display: block;
		box-sizing: border-box;
		padding: 0 24px;
		margin: 0;
		width: 100%;
		font-size: 16px;
		border: none;
		border-radius: 0;
		background: transparent;
		color: var(--fg);
		font-family: inherit;
		max-width: 100%;
		min-width: 100%;
		min-height: 90px;

		&:focus {
			outline: none;
		}

		&:disabled {
			opacity: 0.5;
		}
	}
}
</style>
