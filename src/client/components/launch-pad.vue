<template>
<MkModal ref="modal" @click="$refs.modal.close()" @closed="$emit('closed')">
	<div class="szkkfdyq _popup">
		<div class="main">
			<template v-for="item in items">
				<button v-if="item.action" class="_button" @click="$event => { item.action($event); close(); }">
					<Fa :icon="item.icon" class="icon"/>
					<div class="text">{{ item.text }}</div>
					<i v-if="item.indicate"><Fa :icon="faCircle"/></i>
				</button>
				<MkA v-else :to="item.to" @click.passive="close()">
					<Fa :icon="item.icon" class="icon"/>
					<div class="text">{{ item.text }}</div>
					<i v-if="item.indicate"><Fa :icon="faCircle"/></i>
				</MkA>
			</template>
		</div>
		<div class="sub">
			<MkA to="/docs" @click.passive="close()">
				<Fa :icon="faQuestionCircle" class="icon"/>
				<div class="text">{{ $ts.help }}</div>
			</MkA>
			<MkA to="/about" @click.passive="close()">
				<Fa :icon="faInfoCircle" class="icon"/>
				<div class="text">{{ $t('aboutX', { x: instanceName }) }}</div>
			</MkA>
			<MkA to="/about-misskey" @click.passive="close()">
				<Fa :icon="faInfoCircle" class="icon"/>
				<div class="text">{{ $ts.aboutMisskey }}</div>
			</MkA>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faQuestionCircle, faInfoCircle, faCircle } from '@fortawesome/free-solid-svg-icons';
import MkModal from '@/components/ui/modal.vue';
import { sidebarDef } from '@/sidebar';
import { instanceName } from '@/config';

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
			faQuestionCircle, faInfoCircle, faCircle,
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

			> i {
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
		border-top: solid 1px var(--divider);
	}
}
</style>
