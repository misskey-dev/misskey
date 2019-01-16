<template>
<time class="mk-time" :title="absolute">
	<span v-if=" mode == 'relative' ">{{ relative }}</span>
	<span v-if=" mode == 'absolute' ">{{ absolute }}</span>
	<span v-if=" mode == 'detail' ">{{ absolute }} ({{ relative }})</span>
</time>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n(),
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
			return this._time.toLocaleString();
		},
		relative(): string {
			const time = this._time;
			const ago = (this.now.getTime() - time.getTime()) / 1000/*ms*/;
			return (
				ago >= 31536000 ? this.$t('@.time.years_ago')  .replace('{}', (~~(ago / 31536000)).toString()) :
				ago >= 2592000  ? this.$t('@.time.months_ago') .replace('{}', (~~(ago / 2592000)).toString()) :
				ago >= 604800   ? this.$t('@.time.weeks_ago')  .replace('{}', (~~(ago / 604800)).toString()) :
				ago >= 86400    ? this.$t('@.time.days_ago')   .replace('{}', (~~(ago / 86400)).toString()) :
				ago >= 3600     ? this.$t('@.time.hours_ago')  .replace('{}', (~~(ago / 3600)).toString()) :
				ago >= 60       ? this.$t('@.time.minutes_ago').replace('{}', (~~(ago / 60)).toString()) :
				ago >= 10       ? this.$t('@.time.seconds_ago').replace('{}', (~~(ago % 60)).toString()) :
				ago >= -1       ? this.$t('@.time.just_now') :
				ago <  -1       ? this.$t('@.time.future') :
				this.$t('@.time.unknown'));
		}
	},
	created() {
		if (this.mode == 'relative' || this.mode == 'detail') {
			this.tickId = window.requestAnimationFrame(this.tick);
		}
	},
	destroyed() {
		if (this.mode === 'relative' || this.mode === 'detail') {
			window.clearTimeout(this.tickId);
		}
	},
	methods: {
		tick() {
			this.now = new Date();

			this.tickId = setTimeout(() => {
				window.requestAnimationFrame(this.tick);
			}, 10000);
		}
	}
});
</script>
