<template>
<div class="azykntjl">
	<div class="body">
		<div class="left">
			<MkA v-click-anime v-tooltip="$ts.timeline" class="item index" active-class="active" to="/" exact>
				<i class="fas fa-home fa-fw"></i>
			</MkA>
			<template v-for="item in menu">
				<div v-if="item === '-'" class="divider"></div>
				<component :is="navbarItemDef[item].to ? 'MkA' : 'button'" v-else-if="navbarItemDef[item] && (navbarItemDef[item].show !== false)" v-click-anime v-tooltip="$ts[navbarItemDef[item].title]" class="item _button" :class="item" active-class="active" :to="navbarItemDef[item].to" v-on="navbarItemDef[item].action ? { click: navbarItemDef[item].action } : {}">
					<i class="fa-fw" :class="navbarItemDef[item].icon"></i>
					<span v-if="navbarItemDef[item].indicated" class="indicator"><i class="fas fa-circle"></i></span>
				</component>
			</template>
			<div class="divider"></div>
			<MkA v-if="$i.isAdmin || $i.isModerator" v-click-anime v-tooltip="$ts.controlPanel" class="item" active-class="active" to="/admin" :behavior="settingsWindowed ? 'modalWindow' : null">
				<i class="fas fa-door-open fa-fw"></i>
			</MkA>
			<button v-click-anime class="item _button" @click="more">
				<i class="fas fa-ellipsis-h fa-fw"></i>
				<span v-if="otherNavItemIndicated" class="indicator"><i class="fas fa-circle"></i></span>
			</button>
		</div>
		<div class="right">
			<MkA v-click-anime v-tooltip="$ts.settings" class="item" active-class="active" to="/settings" :behavior="settingsWindowed ? 'modalWindow' : null">
				<i class="fas fa-cog fa-fw"></i>
			</MkA>
			<button v-click-anime class="item _button account" @click="openAccountMenu">
				<MkAvatar :user="$i" class="avatar"/><MkAcct class="acct" :user="$i"/>
			</button>
			<div class="post" @click="post">
				<MkButton class="button" gradate full rounded>
					<i class="fas fa-pencil-alt fa-fw"></i>
				</MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { host } from '@/config';
import { search } from '@/scripts/search';
import * as os from '@/os';
import { navbarItemDef } from '@/navbar';
import { openAccountMenu } from '@/account';
import MkButton from '@/components/MkButton.vue';

export default defineComponent({
	components: {
		MkButton,
	},

	data() {
		return {
			host: host,
			accounts: [],
			connection: null,
			navbarItemDef: navbarItemDef,
			settingsWindowed: false,
		};
	},

	computed: {
		menu(): string[] {
			return this.$store.state.menu;
		},

		otherNavItemIndicated(): boolean {
			for (const def in this.navbarItemDef) {
				if (this.menu.includes(def)) continue;
				if (this.navbarItemDef[def].indicated) return true;
			}
			return false;
		},
	},

	watch: {
		'$store.reactiveState.menuDisplay.value'() {
			this.calcViewState();
		},
	},

	created() {
		window.addEventListener('resize', this.calcViewState);
		this.calcViewState();
	},

	methods: {
		calcViewState() {
			this.settingsWindowed = (window.innerWidth > 1400);
		},

		post() {
			os.post();
		},

		search() {
			search();
		},

		more(ev) {
			os.popup(defineAsyncComponent(() => import('@/components/MkLaunchPad.vue')), {
				src: ev.currentTarget ?? ev.target,
				anchor: { x: 'center', y: 'bottom' },
			}, {
			}, 'closed');
		},

		openAccountMenu: (ev) => {
			openAccountMenu({
				withExtraOperation: true,
			}, ev);
		},
	},
});
</script>

<style lang="scss" scoped>
.azykntjl {
	$height: 60px;
	$avatar-size: 32px;
	$avatar-margin: 8px;

	position: sticky;
	top: 0;
	z-index: 1000;
	width: 100%;
	height: $height;
	background-color: var(--bg);

	> .body {
		max-width: 1380px;
		margin: 0 auto;
		display: flex;

		> .right,
		> .left {

			> .item {
				position: relative;
				font-size: 0.9em;
				display: inline-block;
				padding: 0 12px;
				line-height: $height;

				> i,
				> .avatar {
					margin-right: 0;
				}

				> i {
					left: 10px;
				}

				> .avatar {
					width: $avatar-size;
					height: $avatar-size;
					vertical-align: middle;
				}

				> .indicator {
					position: absolute;
					top: 0;
					left: 0;
					color: var(--navIndicator);
					font-size: 8px;
					animation: blink 1s infinite;
				}

				&:hover {
					text-decoration: none;
					color: var(--navHoverFg);
				}

				&.active {
					color: var(--navActive);
				}
			}

			> .divider {
				display: inline-block;
				height: 16px;
				margin: 0 10px;
				border-right: solid 0.5px var(--divider);
			}

			> .post {
				display: inline-block;
			
				> .button {
					width: 40px;
					height: 40px;
					padding: 0;
					min-width: 0;
				}
			}

			> .account {
				display: inline-flex;
				align-items: center;
				vertical-align: top;
				margin-right: 8px;

				> .acct {
					margin-left: 8px;
				}
			}
		}

		> .right {
			margin-left: auto;
		}
	}
}
</style>
