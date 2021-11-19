<template>
<MkModal ref="modal" @click="done(true)" @closed="$emit('closed')">
	<div class="mk-dialog">
		<div v-if="icon" class="icon">
			<i :class="icon"></i>
		</div>
		<div v-else-if="!input && !select" class="icon" :class="type">
			<i v-if="type === 'success'" class="fas fa-check"></i>
			<i v-else-if="type === 'error'" class="fas fa-times-circle"></i>
			<i v-else-if="type === 'warning'" class="fas fa-exclamation-triangle"></i>
			<i v-else-if="type === 'info'" class="fas fa-info-circle"></i>
			<i v-else-if="type === 'question'" class="fas fa-question-circle"></i>
			<i v-else-if="type === 'waiting'" class="fas fa-spinner fa-pulse"></i>
		</div>
		<header v-if="title"><Mfm :text="title"/></header>
		<div v-if="text" class="body"><Mfm :text="text"/></div>
		<MkInput v-if="input" v-model="inputValue" autofocus :type="input.type || 'text'" :placeholder="input.placeholder" @keydown="onInputKeydown"></MkInput>
		<MkSelect v-if="select" v-model="selectedValue" autofocus>
			<template v-if="select.items">
				<option v-for="item in select.items" :value="item.value">{{ item.text }}</option>
			</template>
			<template v-else>
				<optgroup v-for="groupedItem in select.groupedItems" :label="groupedItem.label">
					<option v-for="item in groupedItem.items" :value="item.value">{{ item.text }}</option>
				</optgroup>
			</template>
		</MkSelect>
		<div v-if="(showOkButton || showCancelButton) && !actions" class="buttons">
			<MkButton v-if="showOkButton" inline primary :autofocus="!input && !select" @click="ok">{{ (showCancelButton || input || select) ? $ts.ok : $ts.gotIt }}</MkButton>
			<MkButton v-if="showCancelButton || input || select" inline @click="cancel">{{ $ts.cancel }}</MkButton>
		</div>
		<div v-if="actions" class="buttons">
			<MkButton v-for="action in actions" :key="action.text" inline :primary="action.primary" @click="() => { action.callback(); close(); }">{{ action.text }}</MkButton>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkModal from '@/components/ui/modal.vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import MkSelect from '@/components/form/select.vue';

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
				e.preventDefault();
				e.stopPropagation();
				this.ok();
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
}
</style>
