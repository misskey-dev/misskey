<template>
	<time>
		<span v-if=" mode == 'relative' ">{{ relative }}</span>
		<span v-if=" mode == 'absolute' ">{{ absolute }}</span>
		<span v-if=" mode == 'detail' ">{{ absolute }} ({{ relative }})</span>
	</time>
</template>

<script lang="typescript">
	import Vue from 'vue';

	export default Vue.extend({
		props: ['time', 'mode'],
		data() {
			return {
				mode: 'relative',
				tickId: null,
				now: new Date()
			};
		},
		computed: {
			absolute() {
				return (
					this.time.getFullYear()    + '年' +
					(this.time.getMonth() + 1) + '月' +
					this.time.getDate()        + '日' +
					' ' +
					this.time.getHours()       + '時' +
					this.time.getMinutes()     + '分');
			},
			relative() {
				const ago = (this.now - this.time) / 1000/*ms*/;
				return (
					ago >= 31536000 ? '%i18n:common.time.years_ago%'  .replace('{}', ~~(ago / 31536000)) :
					ago >= 2592000  ? '%i18n:common.time.months_ago%' .replace('{}', ~~(ago / 2592000)) :
					ago >= 604800   ? '%i18n:common.time.weeks_ago%'  .replace('{}', ~~(ago / 604800)) :
					ago >= 86400    ? '%i18n:common.time.days_ago%'   .replace('{}', ~~(ago / 86400)) :
					ago >= 3600     ? '%i18n:common.time.hours_ago%'  .replace('{}', ~~(ago / 3600)) :
					ago >= 60       ? '%i18n:common.time.minutes_ago%'.replace('{}', ~~(ago / 60)) :
					ago >= 10       ? '%i18n:common.time.seconds_ago%'.replace('{}', ~~(ago % 60)) :
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
