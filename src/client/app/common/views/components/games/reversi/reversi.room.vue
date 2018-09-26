<template>
<div class="urbixznjwwuukfsckrwzwsqzsxornqij">
	<header><b>{{ game.user1 | userName }}</b> vs <b>{{ game.user2 | userName }}</b></header>

	<div>
		<p>%i18n:@settings-of-the-game%</p>

		<div class="card map">
			<header>
				<select v-model="mapName" placeholder="%i18n:@choose-map%" @change="onMapChange">
					<option label="-Custom-" :value="mapName" v-if="mapName == '-Custom-'"/>
					<option label="%i18n:@random%" :value="null"/>
					<optgroup v-for="c in mapCategories" :key="c" :label="c">
						<option v-for="m in maps" v-if="m.category == c" :key="m.name" :label="m.name" :value="m.name">{{ m.name }}</option>
					</optgroup>
				</select>
			</header>

			<div>
				<div class="random" v-if="game.settings.map == null">%fa:dice%</div>
				<div class="board" v-else :style="{ 'grid-template-rows': `repeat(${ game.settings.map.length }, 1fr)`, 'grid-template-columns': `repeat(${ game.settings.map[0].length }, 1fr)` }">
					<div v-for="(x, i) in game.settings.map.join('')"
							:data-none="x == ' '"
							@click="onPixelClick(i, x)">
						<template v-if="x == 'b'"><template v-if="$store.state.device.darkmode">%fa:circle R%</template><template v-else>%fa:circle%</template></template>
						<template v-if="x == 'w'"><template v-if="$store.state.device.darkmode">%fa:circle%</template><template v-else>%fa:circle R%</template></template>
					</div>
				</div>
			</div>
		</div>

		<div class="card">
			<header>
				<span>%i18n:@black-or-white%</span>
			</header>

			<div>
				<form-radio v-model="game.settings.bw" value="random" @change="updateSettings">%i18n:@random%</form-radio>
				<form-radio v-model="game.settings.bw" :value="1" @change="updateSettings">{{ '%i18n:@black-is%'.split('{}')[0] }}<b>{{ game.user1 | userName }}</b>{{ '%i18n:@black-is%'.split('{}')[1] }}</form-radio>
				<form-radio v-model="game.settings.bw" :value="2" @change="updateSettings">{{ '%i18n:@black-is%'.split('{}')[0] }}<b>{{ game.user2 | userName }}</b>{{ '%i18n:@black-is%'.split('{}')[1] }}</form-radio>
			</div>
		</div>

		<div class="card">
			<header>
				<span>%i18n:@rules%</span>
			</header>

			<div>
				<mk-switch v-model="game.settings.isLlotheo" @change="updateSettings" text="%i18n:@is-llotheo%"/>
				<mk-switch v-model="game.settings.loopedBoard" @change="updateSettings" text="%i18n:@looped-map%"/>
				<mk-switch v-model="game.settings.canPutEverywhere" @change="updateSettings" text="%i18n:@can-put-everywhere%"/>
			</div>
		</div>

		<div class="card form" v-if="form">
			<header>
				<span>%i18n:@settings-of-the-bot%</span>
			</header>

			<div>
				<template v-for="item in form">
					<mk-switch v-if="item.type == 'switch'" v-model="item.value" :key="item.id" :text="item.label" @change="onChangeForm(item)">{{ item.desc || '' }}</mk-switch>

					<div class="card" v-if="item.type == 'radio'" :key="item.id">
						<header>
							<span>{{ item.label }}</span>
						</header>

						<div>
							<form-radio v-for="(r, i) in item.items" :key="item.id + ':' + i" v-model="item.value" :value="r.value" @change="onChangeForm(item)">{{ r.label }}</form-radio>
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

	<footer>
		<p class="status">
			<template v-if="isAccepted && isOpAccepted">%i18n:@this-game-is-started-soon%<mk-ellipsis/></template>
			<template v-if="isAccepted && !isOpAccepted">%i18n:@waiting-for-other%<mk-ellipsis/></template>
			<template v-if="!isAccepted && isOpAccepted">%i18n:@waiting-for-me%</template>
			<template v-if="!isAccepted && !isOpAccepted">%i18n:@waiting-for-both%<mk-ellipsis/></template>
		</p>

		<div class="actions">
			<form-button @click="exit">%i18n:@cancel%</form-button>
			<form-button primary @click="accept" v-if="!isAccepted">%i18n:@ready%</form-button>
			<form-button primary @click="cancel" v-if="isAccepted">%i18n:@cancel-ready%</form-button>
		</div>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as maps from '../../../../../../../games/reversi/maps';

export default Vue.extend({
	props: ['game', 'connection'],

	data() {
		return {
			o: null,
			isLlotheo: false,
			mapName: maps.eighteight.name,
			maps: maps,
			form: null,
			messages: []
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
		this.connection.on('change-accepts', this.onChangeAccepts);
		this.connection.on('update-settings', this.onUpdateSettings);
		this.connection.on('init-form', this.onInitForm);
		this.connection.on('message', this.onMessage);

		if (this.game.user1Id != this.$store.state.i.id && this.game.settings.form1) this.form = this.game.settings.form1;
		if (this.game.user2Id != this.$store.state.i.id && this.game.settings.form2) this.form = this.game.settings.form2;
	},

	beforeDestroy() {
		this.connection.off('change-accepts', this.onChangeAccepts);
		this.connection.off('update-settings', this.onUpdateSettings);
		this.connection.off('init-form', this.onInitForm);
		this.connection.off('message', this.onMessage);
	},

	methods: {
		exit() {

		},

		accept() {
			this.connection.send({
				type: 'accept'
			});
		},

		cancel() {
			this.connection.send({
				type: 'cancel-accept'
			});
		},

		onChangeAccepts(accepts) {
			this.game.user1Accepted = accepts.user1;
			this.game.user2Accepted = accepts.user2;
			this.$forceUpdate();
		},

		updateSettings() {
			this.connection.send({
				type: 'update-settings',
				settings: this.game.settings
			});
		},

		onUpdateSettings(settings) {
			this.game.settings = settings;
			if (this.game.settings.map == null) {
				this.mapName = null;
			} else {
				const found = Object.values(maps).find(x => x.data.join('') == this.game.settings.map.join(''));
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
			this.connection.send({
				type: 'update-form',
				id: item.id,
				value: item.value
			});
		},

		onMapChange() {
			if (this.mapName == null) {
				this.game.settings.map = null;
			} else {
				this.game.settings.map = Object.values(maps).find(x => x.name == this.mapName).data;
			}
			this.$forceUpdate();
			this.updateSettings();
		},

		onPixelClick(pos, pixel) {
			const x = pos % this.game.settings.map[0].length;
			const y = Math.floor(pos / this.game.settings.map[0].length);
			const newPixel =
				pixel == ' ' ? '-' :
					pixel == '-' ? 'b' :
						pixel == 'b' ? 'w' :
							' ';
			const line = this.game.settings.map[y].split('');
			line[x] = newPixel;
			this.$set(this.game.settings.map, y, line.join(''));
			this.$forceUpdate();
			this.updateSettings();
		}
	}
});
</script>

<style lang="stylus" scoped>


root(isDark)
	text-align center
	background isDark ? #191b22 : #f9f9f9

	> header
		padding 8px
		border-bottom dashed 1px #c4cdd4

	> div
		padding 0 16px

		> .card
			margin 0 auto 16px auto

			&.map
				> header
					> select
						width 100%
						padding 12px 14px
						background isDark ? #282C37 : #fff
						border 1px solid isDark ? #6a707d : #dcdfe6
						border-radius 4px
						color isDark ? #fff : #606266
						cursor pointer
						transition border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)
						-webkit-appearance none
						-moz-appearance none
						appearance none

						&:hover
							border-color isDark ? #a7aebd : #c0c4cc

						&:focus
						&:active
							border-color var(--primary)

				> div
					> .random
						padding 32px 0
						font-size 64px
						color isDark ? #4e5961 : #d8d8d8

					> .board
						display grid
						grid-gap 4px
						width 300px
						height 300px
						margin 0 auto
						color isDark ? #fff : #444

						> div
							background transparent
							border solid 2px isDark ? #6a767f : #ddd
							border-radius 6px
							overflow hidden
							cursor pointer

							*
								pointer-events none
								user-select none
								width 100%
								height 100%

							&[data-none]
								border-color transparent

			&.form
				> div
					> .card + .card
						margin-top 16px

					input[type='range']
						width 100%

		.card
			max-width 400px
			border-radius 4px
			background isDark ? #282C37 : #fff
			color isDark ? #fff : #303133
			box-shadow 0 2px 12px 0 rgba(#000, isDark ? 0.7 : 0.1)

			> header
				padding 18px 20px
				border-bottom 1px solid isDark ? #1c2023 : #ebeef5

			> div
				padding 20px
				color isDark ? #fff : #606266

	> footer
		position sticky
		bottom 0
		padding 16px
		background rgba(isDark ? #191b22 : #fff, 0.9)
		border-top solid 1px isDark ? #606266 : #c4cdd4

		> .status
			margin 0 0 16px 0

.urbixznjwwuukfsckrwzwsqzsxornqij[data-darkmode]
	root(true)

.urbixznjwwuukfsckrwzwsqzsxornqij:not([data-darkmode])
	root(false)

</style>
