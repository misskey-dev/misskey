<template>
<div class="urbixznjwwuukfsckrwzwsqzsxornqij">
	<header><b><mk-user-name :user="game.user1"/></b> vs <b><mk-user-name :user="game.user2"/></b></header>

	<div>
		<p>{{ $t('_reversi.gameSettings') }}</p>

		<div class="card map">
			<header>
				<select v-model="mapName" :placeholder="$t('_reversi.chooseBoard')" @change="onMapChange">
					<option label="-Custom-" :value="mapName" v-if="mapName == '-Custom-'"/>
					<option :label="$t('random')" :value="null"/>
					<optgroup v-for="c in mapCategories" :key="c" :label="c">
						<option v-for="m in Object.values(maps).filter(m => m.category == c)" :key="m.name" :label="m.name" :value="m.name">{{ m.name }}</option>
					</optgroup>
				</select>
			</header>

			<div>
				<div class="random" v-if="game.map == null"><fa icon="dice"/></div>
				<div class="board" v-else :style="{ 'grid-template-rows': `repeat(${ game.map.length }, 1fr)`, 'grid-template-columns': `repeat(${ game.map[0].length }, 1fr)` }">
					<div v-for="(x, i) in game.map.join('')" :class="{ none: x == ' ' }" @click="onPixelClick(i, x)">
						<fa v-if="x == 'b'" :icon="fasCircle"/>
						<fa v-if="x == 'w'" :icon="farCircle"/>
					</div>
				</div>
			</div>
		</div>

		<div class="card">
			<header>
				<span>{{ $t('_reversi.blackOrWhite') }}</span>
			</header>

			<div>
				<MkRadio v-model="game.bw" value="random" @change="updateSettings('bw')">{{ $t('random') }}</MkRadio>
				<MkRadio v-model="game.bw" :value="1" @change="updateSettings('bw')">
					<i18n-t keypath="_reversi.blackIs" tag="span">
						<template #name>
							<b><mk-user-name :user="game.user1"/></b>
						</template>
					</i18n-t>
				</MkRadio>
				<MkRadio v-model="game.bw" :value="2" @change="updateSettings('bw')">
					<i18n-t keypath="_reversi.blackIs" tag="span">
						<template #name>
							<b><mk-user-name :user="game.user2"/></b>
						</template>
					</i18n-t>
				</MkRadio>
			</div>
		</div>

		<div class="card">
			<header>
				<span>{{ $t('_reversi.rules') }}</span>
			</header>

			<div>
				<MkSwitch v-model="game.isLlotheo" @change="updateSettings('isLlotheo')">{{ $t('is-llotheo') }}</MkSwitch>
				<MkSwitch v-model="game.loopedBoard" @change="updateSettings('loopedBoard')">{{ $t('looped-map') }}</MkSwitch>
				<MkSwitch v-model="game.canPutEverywhere" @change="updateSettings('canPutEverywhere')">{{ $t('can-put-everywhere') }}</MkSwitch>
			</div>
		</div>

		<div class="card form" v-if="form">
			<header>
				<span>{{ $t('_reversi.botSettings') }}</span>
			</header>

			<div>
				<template v-for="item in form">
					<MkSwitch v-if="item.type == 'switch'" v-model="item.value" :key="item.id" @change="onChangeForm(item)">{{ item.label || item.desc || '' }}</MkSwitch>

					<div class="card" v-if="item.type == 'radio'" :key="item.id">
						<header>
							<span>{{ item.label }}</span>
						</header>

						<div>
							<MkRadio v-for="(r, i) in item.items" :key="item.id + ':' + i" v-model="item.value" :value="r.value" @change="onChangeForm(item)">{{ r.label }}</MkRadio>
						</div>
					</div>

					<div class="card" v-if="item.type == 'slider'" :key="item.id">
						<header>
							<span>{{ item.label }}</span>
						</header>

						<div>
							<input type="range" :min="item.min" :max="item.max" :step="item.step || 1" v-model="item.value" @change="onChangeForm(item)"/>
						</div>
					</div>

					<div class="card" v-if="item.type == 'textbox'" :key="item.id">
						<header>
							<span>{{ item.label }}</span>
						</header>

						<div>
							<input v-model="item.value" @change="onChangeForm(item)"/>
						</div>
					</div>
				</template>
			</div>
		</div>
	</div>

	<footer class="_acrylic">
		<p class="status">
			<template v-if="isAccepted && isOpAccepted">{{ $t('_reversi.thisGameIsStartedSoon') }}<mk-ellipsis/></template>
			<template v-if="isAccepted && !isOpAccepted">{{ $t('_reversi.waitingForOther') }}<mk-ellipsis/></template>
			<template v-if="!isAccepted && isOpAccepted">{{ $t('_reversi.waitingForMe') }}</template>
			<template v-if="!isAccepted && !isOpAccepted">{{ $t('_reversi.waitingBoth') }}<mk-ellipsis/></template>
		</p>

		<div class="actions">
			<MkButton inline @click="exit">{{ $t('cancel') }}</MkButton>
			<MkButton inline primary @click="accept" v-if="!isAccepted">{{ $t('_reversi.ready') }}</MkButton>
			<MkButton inline primary @click="cancel" v-if="isAccepted">{{ $t('_reversi.cancelReady') }}</MkButton>
		</div>
	</footer>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCircle as fasCircle } from '@fortawesome/free-solid-svg-icons';
import { faCircle as farCircle } from '@fortawesome/free-regular-svg-icons';
import * as maps from '../../../games/reversi/maps';
import MkButton from '@/components/ui/button.vue';
import MkSwitch from '@/components/ui/switch.vue';
import MkRadio from '@/components/ui/radio.vue';

export default defineComponent({
	components: {
		MkButton,
		MkSwitch,
		MkRadio,
	},

	props: {
		initGame: {
			type: Object,
			require: true
		},
		connection: {
			type: Object,
			require: true
		},
	},

	data() {
		return {
			game: this.initGame,
			o: null,
			isLlotheo: false,
			mapName: maps.eighteight.name,
			maps: maps,
			form: null,
			messages: [],
			fasCircle, farCircle
		};
	},

	computed: {
		mapCategories(): string[] {
			const categories = Object.values(maps).map(x => x.category);
			return categories.filter((item, pos) => categories.indexOf(item) == pos);
		},
		isAccepted(): boolean {
			if (this.game.user1Id == this.$store.state.i.id && this.game.user1Accepted) return true;
			if (this.game.user2Id == this.$store.state.i.id && this.game.user2Accepted) return true;
			return false;
		},
		isOpAccepted(): boolean {
			if (this.game.user1Id != this.$store.state.i.id && this.game.user1Accepted) return true;
			if (this.game.user2Id != this.$store.state.i.id && this.game.user2Accepted) return true;
			return false;
		}
	},

	created() {
		this.connection.on('changeAccepts', this.onChangeAccepts);
		this.connection.on('updateSettings', this.onUpdateSettings);
		this.connection.on('initForm', this.onInitForm);
		this.connection.on('message', this.onMessage);

		if (this.game.user1Id != this.$store.state.i.id && this.game.form1) this.form = this.game.form1;
		if (this.game.user2Id != this.$store.state.i.id && this.game.form2) this.form = this.game.form2;
	},

	beforeDestroy() {
		this.connection.off('changeAccepts', this.onChangeAccepts);
		this.connection.off('updateSettings', this.onUpdateSettings);
		this.connection.off('initForm', this.onInitForm);
		this.connection.off('message', this.onMessage);
	},

	methods: {
		exit() {

		},

		accept() {
			this.connection.send('accept', {});
		},

		cancel() {
			this.connection.send('cancelAccept', {});
		},

		onChangeAccepts(accepts) {
			this.game.user1Accepted = accepts.user1;
			this.game.user2Accepted = accepts.user2;
		},

		updateSettings(key: string) {
			this.connection.send('updateSettings', {
				key: key,
				value: this.game[key]
			});
		},

		onUpdateSettings({ key, value }) {
			this.game[key] = value;
			if (this.game.map == null) {
				this.mapName = null;
			} else {
				const found = Object.values(maps).find(x => x.data.join('') == this.game.map.join(''));
				this.mapName = found ? found.name : '-Custom-';
			}
		},

		onInitForm(x) {
			if (x.userId == this.$store.state.i.id) return;
			this.form = x.form;
		},

		onMessage(x) {
			if (x.userId == this.$store.state.i.id) return;
			this.messages.unshift(x.message);
		},

		onChangeForm(item) {
			this.connection.send('updateForm', {
				id: item.id,
				value: item.value
			});
		},

		onMapChange() {
			if (this.mapName == null) {
				this.game.map = null;
			} else {
				this.game.map = Object.values(maps).find(x => x.name == this.mapName).data;
			}
			this.updateSettings('map');
		},

		onPixelClick(pos, pixel) {
			const x = pos % this.game.map[0].length;
			const y = Math.floor(pos / this.game.map[0].length);
			const newPixel =
				pixel == ' ' ? '-' :
				pixel == '-' ? 'b' :
				pixel == 'b' ? 'w' :
				' ';
			const line = this.game.map[y].split('');
			line[x] = newPixel;
			this.game.map[y] = line.join('');
			this.updateSettings('map');
		}
	}
});
</script>

<style lang="scss" scoped>
.urbixznjwwuukfsckrwzwsqzsxornqij {
	text-align: center;
	background: var(--bg);

	> header {
		padding: 8px;
		border-bottom: dashed 1px #c4cdd4;
	}

	> div {
		padding: 0 16px;

		> .card {
			margin: 0 auto 16px auto;

			&.map {
				> header {
					> select {
						width: 100%;
						padding: 12px 14px;
						background: var(--face);
						border: 1px solid var(--inputBorder);
						border-radius: 4px;
						color: var(--fg);
						cursor: pointer;
						transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
						-webkit-appearance: none;
						-moz-appearance: none;
						appearance: none;

						&:focus,
						&:active {
							border-color: var(--primary);
						}
					}
				}

				> div {
					> .random {
						padding: 32px 0;
						font-size: 64px;
						color: var(--fg);
						opacity: 0.7;
					}

					> .board {
						display: grid;
						grid-gap: 4px;
						width: 300px;
						height: 300px;
						margin: 0 auto;
						color: var(--fg);

						> div {
							background: transparent;
							border: solid 2px var(--divider);
							border-radius: 6px;
							overflow: hidden;
							cursor: pointer;

							* {
								pointer-events: none;
								user-select: none;
								width: 100%;
								height: 100%;
							}

							&.none {
								border-color: transparent;
							}
						}
					}
				}
			}

			&.form {
				> div {
					> .card + .card {
						margin-top: 16px;
					}

					input[type='range'] {
						width: 100%;
					}
				}
			}
		}

		.card {
			max-width: 400px;
			border-radius: 4px;
			background: var(--panel);
			color: var(--fg);
			box-shadow: 0 2px 12px 0 var(--reversiRoomFormShadow);

			> header {
				padding: 18px 20px;
				border-bottom: 1px solid var(--divider);
			}

			> div {
				padding: 20px;
				color: var(--fg);
			}
		}
	}

	> footer {
		position: sticky;
		bottom: 0;
		padding: 16px;
		border-top: solid 1px var(--divider);

		> .status {
			margin: 0 0 16px 0;
		}
	}
}
</style>
