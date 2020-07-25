<template>
<transition name="zoom-in-top" appear>
	<div class="buebdbiu" v-if="show">
		<slot>{{ text }}</slot>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		source: {
			required: true,
		},
		text: {
			type: String,
			required: false
		}
	},

	data() {
		return {
			show: false
		};
	},

	mounted() {
		this.show = true;

		this.$nextTick(() => {
			if (this.source == null) {
				this.destroyDom();
				return;
			}
			const rect = this.source.getBoundingClientRect();

			const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
			const y = rect.top + window.pageYOffset + this.source.offsetHeight;
			this.$el.style.left = (x - 28) + 'px';
			this.$el.style.top = (y + 16) + 'px';
		});
	},

	methods: {
		close() {
			this.show = false;
			setTimeout(this.destroyDom, 300);
		}
	}
})
</script>

<style lang="scss" scoped>
.buebdbiu {
	z-index: 11000;
	display: block;
	position: absolute;
	max-width: 240px;
	font-size: 0.8em;
	padding: 6px 8px;
	background: var(--panel);
	text-align: center;
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.25);
	pointer-events: none;
	transform-origin: center -16px;

	&:before {
		content: "";
		pointer-events: none;
		display: block;
		position: absolute;
		top: -28px;
		left: 12px;
		border-top: solid 14px transparent;
		border-right: solid 14px transparent;
		border-bottom: solid 14px rgba(0,0,0,0.1);
		border-left: solid 14px transparent;
	}

	&:after {
		content: "";
		pointer-events: none;
		display: block;
		position: absolute;
		top: -27px;
		left: 12px;
		border-top: solid 14px transparent;
		border-right: solid 14px transparent;
		border-bottom: solid 14px var(--panel);
		border-left: solid 14px transparent;
	}
}
</style>
