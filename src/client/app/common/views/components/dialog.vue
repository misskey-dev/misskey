<template>
<div class="felqjxyj" :class="{ splash }">
	<div class="bg" ref="bg" @click="onBgClick"></div>
	<div class="main" ref="main" :class="{ round: $store.state.device.roundedCorners }">
		<template v-if="type == 'signin'">
			<mk-signin/>
		</template>
		<template v-else>
			<div class="icon" v-if="icon">
				<fa :icon="icon"/>
			</div>
			<div class="icon" v-else-if="!input && !select && !user" :class="type">
				<fa icon="check" v-if="type === 'success'"/>
				<fa :icon="faTimesCircle" v-if="type === 'error'"/>
				<fa icon="exclamation-triangle" v-if="type === 'warning'"/>
				<fa icon="info-circle" v-if="type === 'info'"/>
				<fa :icon="faQuestionCircle" v-if="type === 'question'"/>
				<fa icon="spinner" pulse v-if="type === 'waiting'"/>
			</div>
			<header v-if="title" v-html="title"></header>
			<header v-if="title == null && user">{{ $t('@.enter-username') }}</header>
			<div class="body" v-if="text" v-html="text"></div>
			<ui-input v-if="input" v-model="inputValue" autofocus :type="input.type || 'text'" :placeholder="input.placeholder" @keydown="onInputKeydown"></ui-input>
			<ui-input v-if="user" v-model="userInputValue" autofocus @keydown="onInputKeydown"><template #prefix>@</template></ui-input>
			<ui-select v-if="select" v-model="selectedValue" autofocus>
				<template v-if="select.items">
					<option v-for="item in select.items" :value="item.value">{{ item.text }}</option>
				</template>
				<template v-else>
					<optgroup v-for="groupedItem in select.groupedItems" :label="groupedItem.label">
						<option v-for="item in groupedItem.items" :value="item.value">{{ item.text }}</option>
					</optgroup>
				</template>
			</ui-select>
			<ui-horizon-group no-grow class="buttons fit-bottom" v-if="!splash && (showOkButton || showCancelButton)">
				<ui-button @click="ok" v-if="showOkButton" primary :autofocus="!input && !select && !user" :disabled="!canOk">{{ (showCancelButton || input || select || user) ? $t('@.ok') : $t('@.got-it') }}</ui-button>
				<ui-button @click="cancel" v-if="showCancelButton || input || select || user">{{ $t('@.cancel') }}</ui-button>
			</ui-horizon-group>
		</template>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import anime from 'animejs';
import { faTimesCircle, faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import parseAcct from "../../../../../misc/acct/parse";
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n(),
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
		splash: {
			type: Boolean,
			default: false
		}
	},

	data() {
		return {
			inputValue: this.input && this.input.default ? this.input.default : null,
			userInputValue: null,
			selectedValue: this.select ? this.select.default ? this.select.default : this.select.items ? this.select.items[0].value : this.select.groupedItems[0].items[0].value : null,
			canOk: true,
			faTimesCircle, faQuestionCircle
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

		this.$nextTick(() => {
			(this.$refs.bg as any).style.pointerEvents = 'auto';
			anime({
				targets: this.$refs.bg,
				opacity: 1,
				duration: 100,
				easing: 'linear'
			});

			anime({
				targets: this.$refs.main,
				opacity: 1,
				scale: [1.2, 1],
				duration: 300,
				easing: 'cubicBezier(0, 0.5, 0.5, 1)'
			});

			if (this.splash) {
				setTimeout(() => {
					this.close();
				}, 1000);
			}
		});
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
			this.$el.style.pointerEvents = 'none';
			(this.$refs.bg as any).style.pointerEvents = 'none';
			(this.$refs.main as any).style.pointerEvents = 'none';

			anime({
				targets: this.$refs.bg,
				opacity: 0,
				duration: 300,
				easing: 'linear'
			});
			anime({
				targets: this.$refs.main,
				opacity: 0,
				scale: 0.8,
				duration: 300,
				easing: 'cubicBezier(0, 0.5, 0.5, 1)',
				complete: () => this.destroyDom()
			});
		},

		onBgClick() {
			if (this.cancelableByBgClick) {
				this.cancel();
			}
		},

		onInputKeydown(e) {
			if (e.which == 13) { // Enter
				e.preventDefault();
				e.stopPropagation();
				this.ok();
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.felqjxyj
	display flex
	align-items center
	justify-content center
	position fixed
	z-index 30000
	top 0
	left 0
	width 100%
	height 100%

	&.splash
		> .main
			min-width 0
			width initial

	> .bg
		display block
		position fixed
		top 0
		left 0
		width 100%
		height 100%
		background rgba(#000, 0.7)
		opacity 0
		pointer-events none

	> .main
		display block
		position fixed
		margin auto
		padding 32px
		min-width 320px
		max-width 480px
		width calc(100% - 32px)
		text-align center
		background var(--face)
		color var(--faceText)
		opacity 0

		&.round
			border-radius 8px

		> .icon
			font-size 32px

			&.success
				color #85da5a

			&.error
				color #ec4137

			&.warning
				color #ecb637

			> *
				display block
				margin 0 auto

			& + header
				margin-top 16px

		> header
			margin 0 0 8px 0
			font-weight bold
			font-size 20px

			& + .body
				margin-top 8px

		> .body
			margin 16px 0 0 0

		> .buttons
			margin-top 16px

</style>
