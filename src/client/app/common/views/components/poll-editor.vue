<template>
<div class="zmdxowus">
	<p class="caution" v-if="choices.length < 2">
		<fa icon="exclamation-triangle"/>{{ $t('no-only-one-choice') }}
	</p>
	<ul ref="choices">
		<li v-for="(choice, i) in choices">
			<input :value="choice" @input="onInput(i, $event)" :placeholder="$t('choice-n').replace('{}', i + 1)">
			<button @click="remove(i)" :title="$t('remove')">
				<fa icon="times"/>
			</button>
		</li>
	</ul>
	<button class="add" v-if="choices.length < 10" @click="add">{{ $t('add') }}</button>
	<button class="add" v-else disabled>{{ $t('no-more') }}</button>
	<button class="destroy" @click="destroy" :title="$t('destroy')">
		<fa icon="times"/>
	</button>
	<section>
		<ui-switch v-model="multiple">{{ $t('multiple') }}</ui-switch>
		<div>
			<ui-select v-model="expiration">
				<template #label>{{ $t('expiration') }}</template>
				<option value="infinite">{{ $t('infinite') }}</option>
				<option value="at">{{ $t('at') }}</option>
				<option value="after">{{ $t('after') }}</option>
			</ui-select>
			<section v-if="expiration === 'at'">
				<ui-input v-model="atDate" type="date">
					<template #title>{{ $t('deadline-date') }}</template>
				</ui-input>
				<ui-input v-model="atTime" type="time">
					<template #title>{{ $t('deadline-time') }}</template>
				</ui-input>
			</section>
			<section v-if="expiration === 'after'">
				<ui-input v-model="after" type="number">
					<template #title>{{ $t('interval') }}</template>
				</ui-input>
				<ui-select v-model="unit">
					<template #title>{{ $t('unit') }}</template>
					<option value="second">{{ $t('second') }}</option>
					<option value="minute">{{ $t('minute') }}</option>
					<option value="hour">{{ $t('hour') }}</option>
					<option value="day">{{ $t('day') }}</option>
				</ui-select>
			</section>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { erase } from '../../../../../prelude/array';
import { addTimespan } from '../../../../../prelude/time';
import { formatDateTimeString } from '../../../../../misc/format-time-string';

export default Vue.extend({
	i18n: i18n('common/views/components/poll-editor.vue'),
	data() {
		return {
			choices: ['', ''],
			multiple: false,
			expiration: 'infinite',
			atDate: formatDateTimeString(addTimespan(new Date(), 1, 'days'), 'yyyy-MM-dd'),
			atTime: '00:00',
			after: 0,
			unit: 'second'
		};
	},
	watch: {
		choices() {
			this.$emit('updated');
		}
	},
	methods: {
		onInput(i, e) {
			Vue.set(this.choices, i, e.target.value);
		},

		add() {
			this.choices.push('');
			this.$nextTick(() => {
				(this.$refs.choices as any).childNodes[this.choices.length - 1].childNodes[0].focus();
			});
		},

		remove(i) {
			this.choices = this.choices.filter((_, _i) => _i != i);
		},

		destroy() {
			this.$emit('destroyed');
		},

		get() {
			const at = () => {
				return new Date(`${this.atDate} ${this.atTime}`).getTime();
			};

			const after = () => {
				let base = parseInt(this.after);
				switch (this.unit) {
					case 'day': base *= 24;
					case 'hour': base *= 60;
					case 'minute': base *= 60;
					case 'second': return base *= 1000;
					default: return null;
				}
			};

			return {
				choices: erase('', this.choices),
				multiple: this.multiple,
				...(
					this.expiration === 'at' ? { expiresAt: at() } :
					this.expiration === 'after' ? { expiredAfter: after() } : {})
			};
		},

		set(data) {
			if (data.choices.length == 0) return;
			this.choices = data.choices;
			if (data.choices.length == 1) this.choices = this.choices.concat('');
			this.multiple = data.multiple;
			if (data.expiresAt) {
				this.expiration = 'at';
				this.atDate = this.atTime = data.expiresAt;
			} else if (typeof data.expiredAfter === 'number') {
				this.expiration = 'after';
				this.after = data.expiredAfter;
			} else {
				this.expiration = 'infinite';
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.zmdxowus
	padding 8px

	> .caution
		margin 0 0 8px 0
		font-size 0.8em
		color #f00

		> [data-icon]
			margin-right 4px

	> ul
		display block
		margin 0
		padding 0
		list-style none

		> li
			display block
			margin 8px 0
			padding 0
			width 100%

			&:first-child
				margin-top 0

			&:last-child
				margin-bottom 0

			> input
				padding 6px 8px
				width 300px
				font-size 14px
				color var(--inputText)
				background var(--pollEditorInputBg)
				border solid 1px var(--primaryAlpha01)
				border-radius 4px

				&:hover
					border-color var(--primaryAlpha02)

				&:focus
					border-color var(--primaryAlpha05)

			> button
				padding 4px 8px
				color var(--primaryAlpha04)

				&:hover
					color var(--primaryAlpha06)

				&:active
					color var(--primaryDarken30)

	> .add
		margin 8px 0 0 0
		vertical-align top
		color var(--primary)
		z-index 1

	> .destroy
		position absolute
		top 0
		right 0
		padding 4px 8px
		color var(--primaryAlpha04)

		&:hover
			color var(--primaryAlpha06)

		&:active
			color var(--primaryDarken30)

	> section
		margin 16px 0 -16px 0

		> div
			margin 0 8px

			&:last-child
				flex 1 0 auto

				> section
					align-items center
					display flex
					margin -32px 0 0

					> :first-child
						margin-right 16px

					> .ui-input
						flex 1 0 auto
</style>
