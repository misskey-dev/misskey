<template>
<div class="mk-dialog" :class="{ iconOnly }">
	<transition :name="$store.state.device.animation ? 'bg-fade' : ''" appear>
		<div class="bg _modalBg" ref="bg" @click="onBgClick" v-if="show"></div>
	</transition>
	<transition :name="$store.state.device.animation ? 'dialog' : ''" appear @after-leave="() => { destroyDom(); }">
		<div class="main" ref="main" v-if="show">
			<template v-if="type == 'signin'">
				<mk-signin/>
			</template>
			<template v-else>
				<div class="icon" v-if="icon">
					<fa :icon="icon"/>
				</div>
				<div class="icon" v-else-if="!input && !select && !user" :class="type">
					<fa :icon="faCheck" v-if="type === 'success'"/>
					<fa :icon="faTimesCircle" v-if="type === 'error'"/>
					<fa :icon="faExclamationTriangle" v-if="type === 'warning'"/>
					<fa :icon="faInfoCircle" v-if="type === 'info'"/>
					<fa :icon="faQuestionCircle" v-if="type === 'question'"/>
					<fa :icon="faSpinner" pulse v-if="type === 'waiting'"/>
				</div>
				<header v-if="title" v-html="title"></header>
				<header v-if="title == null && user">{{ $t('enterUsername') }}</header>
				<div class="body" v-if="text" v-html="text"></div>
				<mk-input v-if="input" v-model="inputValue" autofocus :type="input.type || 'text'" :placeholder="input.placeholder" @keydown="onInputKeydown"></mk-input>
				<mk-input v-if="user" v-model="userInputValue" autofocus @keydown="onInputKeydown"><template #prefix>@</template></mk-input>
				<mk-select v-if="select" v-model="selectedValue" autofocus>
					<template v-if="select.items">
						<option v-for="item in select.items" :value="item.value">{{ item.text }}</option>
					</template>
					<template v-else>
						<optgroup v-for="groupedItem in select.groupedItems" :label="groupedItem.label">
							<option v-for="item in groupedItem.items" :value="item.value">{{ item.text }}</option>
						</optgroup>
					</template>
				</mk-select>
				<div class="buttons" v-if="!iconOnly && (showOkButton || showCancelButton) && !actions">
					<mk-button inline @click="ok" v-if="showOkButton" primary :autofocus="!input && !select && !user" :disabled="!canOk">{{ (showCancelButton || input || select || user) ? $t('ok') : $t('gotIt') }}</mk-button>
					<mk-button inline @click="cancel" v-if="showCancelButton || input || select || user">{{ $t('cancel') }}</mk-button>
				</div>
				<div class="buttons" v-if="actions">
					<mk-button v-for="action in actions" inline @click="() => { action.callback(); close(); }" :primary="action.primary" :key="action.text">{{ action.text }}</mk-button>
				</div>
			</template>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faSpinner, faInfoCircle, faExclamationTriangle, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faTimesCircle, faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import MkButton from './ui/button.vue';
import MkInput from './ui/input.vue';
import MkSelect from './ui/select.vue';
import MkSignin from './signin.vue';
import parseAcct from '../../misc/acct/parse';

export default Vue.extend({
	components: {
		MkButton,
		MkInput,
		MkSelect,
		MkSignin,
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
		user: {
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
		iconOnly: {
			type: Boolean,
			default: false
		},
		autoClose: {
			type: Boolean,
			default: false
		}
	},

	data() {
		return {
			show: true,
			inputValue: this.input && this.input.default ? this.input.default : null,
			userInputValue: null,
			selectedValue: this.select ? this.select.default ? this.select.default : this.select.items ? this.select.items[0].value : this.select.groupedItems[0].items[0].value : null,
			canOk: true,
			faTimesCircle, faQuestionCircle, faSpinner, faInfoCircle, faExclamationTriangle, faCheck
		};
	},

	watch: {
		userInputValue() {
			if (this.user) {
				this.$root.api('users/show', parseAcct(this.userInputValue)).then(u => {
					this.canOk = u != null;
				}).catch(() => {
					this.canOk = false;
				});
			}
		}
	},

	mounted() {
		if (this.user) this.canOk = false;

		if (this.autoClose) {
			setTimeout(() => {
				this.close();
			}, 1000);
		}

		document.addEventListener('keydown', this.onKeydown);
	},

	beforeDestroy() {
		document.removeEventListener('keydown', this.onKeydown);
	},

	methods: {
		async ok() {
			if (!this.canOk) return;
			if (!this.showOkButton) return;

			if (this.user) {
				const user = await this.$root.api('users/show', parseAcct(this.userInputValue));
				if (user) {
					this.$emit('ok', user);
					this.close();
				}
			} else {
				const result =
					this.input ? this.inputValue :
					this.select ? this.selectedValue :
					true;
				this.$emit('ok', result);
				this.close();
			}
		},

		cancel() {
			this.$emit('cancel');
			this.close();
		},

		close() {
			if (!this.show) return;
			this.show = false;
			this.$el.style.pointerEvents = 'none';
			(this.$refs.bg as any).style.pointerEvents = 'none';
			(this.$refs.main as any).style.pointerEvents = 'none';
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
.dialog-enter-active, .dialog-leave-active {
	transition: opacity 0.3s, transform 0.3s !important;
}
.dialog-enter, .dialog-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.bg-fade-enter-active, .bg-fade-leave-active {
	transition: opacity 0.3s !important;
}
.bg-fade-enter, .bg-fade-leave-to {
	opacity: 0;
}

.mk-dialog {
	display: flex;
	align-items: center;
	justify-content: center;
	position: fixed;
	z-index: 30000;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;

	&.iconOnly > .main {
		min-width: 0;
		width: initial;
	}

	> .main {
		display: block;
		position: fixed;
		margin: auto;
		padding: 32px;
		min-width: 320px;
		max-width: 480px;
		box-sizing: border-box;
		width: calc(100% - 32px);
		text-align: center;
		background: var(--panel);
		border-radius: var(--radius);

		> .icon {
			font-size: 32px;

			&.success {
				color: var(--accent);
			}

			&.error {
				color: #ec4137;
			}

			&.warning {
				color: #ecb637;
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
}
</style>
