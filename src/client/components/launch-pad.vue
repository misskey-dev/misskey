<template>
<MkModal ref="modal" @click="$refs.modal.close()" @closed="$emit('closed')">
	<div class="szkkfdyq _popup">
		<div class="main">
			<template v-for="item in items">
				<button v-if="item.action" class="_button" @click="$event => { item.action($event); close(); }">
					<i class="icon" :class="item.icon"></i>
					<div class="text">{{ item.text }}</div>
					<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
				</button>
				<MkA v-else :to="item.to" @click.passive="close()">
					<i class="icon" :class="item.icon"></i>
					<div class="text">{{ item.text }}</div>
					<span v-if="item.indicate" class="indicator"><i class="fas fa-circle"></i></span>
				</MkA>
			</template>
		</div>
		<div class="sub">
			<MkA to="/docs" @click.passive="close()">
				<i class="fas fa-question-circle icon"></i>
				<div class="text">{{ $ts.help }}</div>
			</MkA>
			<MkA to="/about" @click.passive="close()">
				<i class="fas fa-info-circle icon"></i>
				<div class="text">{{ $t('aboutX', { x: instanceName }) }}</div>
			</MkA>
			<MkA to="/about-misskey" @click.passive="close()">
				<i class="fas fa-info-circle icon"></i>
				<div class="text">{{ $ts.aboutMisskey }}</div>
			</MkA>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkModal from '@client/components/ui/modal.vue';
import { sidebarDef } from '@client/sidebar';
import { instanceName } from '@client/config';

export default defineComponent({
	components: {
		MkModal,
	},

	emits: ['closed'],

	data() {
		return {
			menuDef: sidebarDef,
			items: [],
			instanceName,
		};
	},

	computed: {
		menu(): string[] {
			return this.$store.state.menu;
		},
	},

	created() {
		this.items = Object.keys(this.menuDef).filter(k => !this.menu.includes(k)).map(k => this.menuDef[k]).filter(def => def.show == null ? true : def.show).map(def => ({
			type: def.to ? 'link' : 'button',
			text: this.$ts[def.title],
			icon: def.icon,
			to: def.to,
			action: def.action,
			indicate: def.indicated,
		}));
	},

	methods: {
		close() {
			this.$refs.modal.close();
		}
	}
});
</script>

<style lang="scss" scoped>
.szkkfdyq {
	width: 100%;
	max-height: 100%;
	max-width: 800px;
	padding: 32px;
	box-sizing: border-box;
	overflow: auto;
	text-align: center;
	border-radius: 16px;

	@media (max-width: 500px) {
		padding: 16px;
	}
	
	> .main, > .sub {
		> * {
			position: relative;
			display: inline-flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			width: 128px;
			height: 128px;
			border-radius: var(--radius);

			@media (max-width: 500px) {
				width: 100px;
				height: 100px;
			}

			&:hover {
				background: rgba(0, 0, 0, 0.05);
				text-decoration: none;
			}

			> .icon {
				font-size: 26px;
			}

			> .text {
				margin-top: 8px;
				font-size: 0.9em;
				line-height: 1.5em;
			}

			> .indicator {
				position: absolute;
				top: 32px;
				left: 32px;
				color: var(--indicator);
				font-size: 8px;
				animation: blink 1s infinite;

				@media (max-width: 500px) {
					top: 16px;
					left: 16px;
				}
			}
		}
	}

	> .sub {
		margin-top: 8px;
		padding-top: 8px;
		border-top: solid 0.5px var(--divider);
	}
}
</style>
