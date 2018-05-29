<template>
<div class="clock">
	<div class="header">
		<time ref="time">
			<span class="yyyymmdd">{{ yyyy }}/{{ mm }}/{{ dd }}</span>
			<br>
			<span class="hhnn">{{ hh }}<span :style="{ visibility: now.getSeconds() % 2 == 0 ? 'visible' : 'hidden' }">:</span>{{ nn }}</span>
		</time>
	</div>
	<div class="content">
		<mk-analog-clock :dark="true"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			now: new Date(),
			clock: null
		};
	},
	computed: {
		yyyy(): number {
			return this.now.getFullYear();
		},
		mm(): string {
			return ('0' + (this.now.getMonth() + 1)).slice(-2);
		},
		dd(): string {
			return ('0' + this.now.getDate()).slice(-2);
		},
		hh(): string {
			return ('0' + this.now.getHours()).slice(-2);
		},
		nn(): string {
			return ('0' + this.now.getMinutes()).slice(-2);
		}
	},
	mounted() {
		this.tick();
		this.clock = setInterval(this.tick, 1000);
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
		tick() {
			this.now = new Date();
		}
	}
});
</script>

<style lang="stylus" scoped>
.clock
	display inline-block
	overflow visible

	> .header
		padding 0 12px
		text-align center
		font-size 10px

		&, *
			cursor: default

		&:hover
			background #899492

			& + .content
				visibility visible

			> time
				color #fff !important

				*
					color #fff !important

		&:after
			content ""
			display block
			clear both

		> time
			display table-cell
			vertical-align middle
			height 48px
			color #9eaba8

			> .yyyymmdd
				opacity 0.7

	> .content
		visibility hidden
		display block
		position absolute
		top auto
		right 0
		z-index 3
		margin 0
		padding 0
		width 256px
		background #899492

</style>
