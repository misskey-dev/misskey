<template>
<time class="mk-time">
	<span v-if=" mode == 'relative' ">{{ relative }}</span>
	<span v-if=" mode == 'absolute' ">{{ absolute }}</span>
	<span v-if=" mode == 'detail' ">{{ absolute }} ({{ relative }})</span>
</time>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		time: {
			type: [Date, String],
			required: true
		},
		mode: {
			type: String,
			default: 'relative'
		}
	},
	data() {
		return {
			tickId: null,
			now: new Date()
		};
	},
	computed: {
		_time(): Date {
			return typeof this.time == 'string' ? new Date(this.time) : this.time;
		},
		absolute(): string {
			const time = this._time;
			return (
				time.getFullYear()    + '年' +
				(time.getMonth() + 1) + '月' +
				time.getDate()        + '日' +
				' ' +
				time.getHours()       + '時' +
				time.getMinutes()     + '分');
		},
		relative(): string {
			const time = this._time;
			const ago = (this.now.getTime() - time.getTime()) / 1000/*ms*/;
			return (
				ago >= 31536000 ? '%i18n:common.time.years_ago%'  .replace('{}', (~~(ago / 31536000)).toString()) :
				ago >= 2592000  ? '%i18n:common.time.months_ago%' .replace('{}', (~~(ago / 2592000)).toString()) :
				ago >= 604800   ? '%i18n:common.time.weeks_ago%'  .replace('{}', (~~(ago / 604800)).toString()) :
				ago >= 86400    ? '%i18n:common.time.days_ago%'   .replace('{}', (~~(ago / 86400)).toString()) :
				ago >= 3600     ? '%i18n:common.time.hours_ago%'  .replace('{}', (~~(ago / 3600)).toString()) :
				ago >= 60       ? '%i18n:common.time.minutes_ago%'.replace('{}', (~~(ago / 60)).toString()) :
				ago >= 10       ? '%i18n:common.time.seconds_ago%'.replace('{}', (~~(ago % 60)).toString()) :
				ago >= 0        ? '%i18n:common.time.just_now%' :
				ago <  0        ? '%i18n:common.time.future%' :
				'%i18n:common.time.unknown%');
		}
	},
	created() {
		if (this.mode == 'relative' || this.mode == 'detail') {
			this.tick();
			this.tickId = setInterval(this.tick, 1000);
		}
	},
	destroyed() {
		if (this.mode === 'relative' || this.mode === 'detail') {
			clearInterval(this.tickId);
		}
	},
	methods: {
		tick() {
			this.now = new Date();
		}
	}
});
</script>
