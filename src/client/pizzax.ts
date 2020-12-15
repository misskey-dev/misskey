import { customRef, onUnmounted, Ref, ref } from 'vue';
import { $i, $i } from './account';
import { api } from './os';

type StateDef = Record<string, {
	where: 'account' | 'device' | 'deviceAccount';
	default: any;
}>;

/**
 * 非リアクティブなストレージ。リアクティブに扱いたいときはrefメソッドを使用する（暫定）
 */
export class Storage<T extends StateDef, M extends Record<string, (state: T, arg: unknown) => void>> {
	public readonly key: string;

	public readonly def: T;

	public readonly state: { [U in keyof T]: T[U]['default'] };

	public readonly mutations: M;

	private watchers: { key: keyof T, callback: Function }[] = [];

	constructor(key: string, def: T, mutations?: M) {
		this.key = 'pizzax::' + key;
		this.def = def;

		// TODO: indexedDBにする
		const deviceState = JSON.parse(localStorage.getItem(this.key) || '{}');
		const deviceAccountState = $i ? JSON.parse(localStorage.getItem(this.key + '::' + $i.id) || '{}') : {};

		const state = {};
		for (const [k, v] of Object.entries(def)) {
			if (v.where === 'device' && Object.prototype.hasOwnProperty.call(deviceState, k)) {
				state[k] = deviceState[k];
			} else if (v.where === 'account' && $i && Object.prototype.hasOwnProperty.call($i.clientData, k)) {
				state[k] = $i.clientData[k];
			} else if (v.where === 'deviceAccount' && Object.prototype.hasOwnProperty.call(deviceAccountState, k)) {
				state[k] = deviceAccountState[k];
			} else {
				state[k] = v.default;
			}
		}
		this.state = state as any;

		this.mutations = mutations;
	}

	public set(key: keyof T, value: any): any {
		this.state[key] = value;
		for (const watcher of this.watchers) {
			if (watcher.key === key) watcher.callback(value);
		}

		switch (this.def[key].where) {
			case 'device': {
				const deviceState = JSON.parse(localStorage.getItem(this.key) || '{}');
				deviceState[key] = value;
				localStorage.setItem(this.key, JSON.stringify(deviceState));
				break;
			}
			case 'deviceAccount': {
				if ($i == null) break;
				const deviceAccountState = JSON.parse(localStorage.getItem(this.key + '::' + $i.id) || '{}');
				deviceAccountState[key] = value;
				localStorage.setItem(this.key + '::' + $i.id, JSON.stringify(deviceAccountState));
				break;
			}
			case 'account': {
				api('i/update-client-setting', {
					name: key,
					value: value
				});
				break;
			}
		}
	}

	public reset(key: keyof T) {
		this.set(key, this.def[key].default);
	}

	public commit(name: keyof M, arg: any) {
		if (_DEV_) {
			if (this.mutations[name] == null) {
				console.error('UNRECOGNIZED MUTATION: ' + name);
			}
		}
		this.mutations[name](this.state, arg);
		localStorage.setItem(this.key, JSON.stringify(this.state));
	}

	/**
	 * 特定のキーの、簡易的なgetter/setterを作ります
	 * 主にvue場で設定コントロールのmodelとして使う用
	 */
	public makeGetterSetter<K extends keyof T>(key: K, getter?: (v: T[K]) => unknown, setter?: (v: unknown) => T[K]) {
		// TODO: VueのcustomRef使うと良い感じになるかも
		const valueRef = ref(this.state[key]);
		return {
			get: () => {
				if (getter) {
					return getter(valueRef.value);
				} else {
					return valueRef.value;
				}
			},
			set: (value: unknown) => {
				const val = setter ? setter(value) : value;
				this.set(key, val);
				valueRef.value = val;
			}
		};
	}

	public ref<K extends keyof T>(key: K) {
		return customRef((track, trigger) => {
			// TODO: pushしたままだとメモリリークするので何らかの方法で参照が無くなったことを検知し削除する
			this.watchers.push({
				key,
				callback: () => {
					trigger();
				}
			});

			onUnmounted(() => {
				// TODO
			});

			return {
				get: () => {
					track();
					return this.state[key];
				},
				set: (newValue) => {
					if (_DEV_) {
						console.error(`DO NOT MUTATE ${key} DIRECTLY. USE set METHOD.`);
					}
				}
			};
		});
	}
}

export const defaultStore = new Storage('base', {
	tutorial: {
		where: 'account',
		default: 0
	},
	keepCw: {
		where: 'account',
		default: false
	},
	showFullAcct: {
		where: 'account',
		default: false
	},
	rememberNoteVisibility: {
		where: 'account',
		default: false
	},
	defaultNoteVisibility: {
		where: 'account',
		default: 'public'
	},
	defaultNoteLocalOnly: {
		where: 'account',
		default: false
	},
	uploadFolder: {
		where: 'account',
		default: null
	},
	pastedFileName: {
		where: 'account',
		default: 'yyyy-MM-dd HH-mm-ss [{{number}}]'
	},
	memo: {
		where: 'account',
		default: null
	},
	reactions: {
		where: 'account',
		default: ['👍', '❤️', '😆', '🤔', '😮', '🎉', '💢', '😥', '😇', '🍮']
	},
	mutedWords: {
		where: 'account',
		default: []
	},

	menu: {
		where: 'deviceAccount',
		default: [
			'notifications',
			'messaging',
			'drive',
			'-',
			'followRequests',
			'featured',
			'explore',
			'announcements',
			'search',
			'-',
			'ui',
		]
	},

	serverDisconnectedBehavior: {
		where: 'device',
		default: 'quiet' as 'quiet' | 'reload' | 'dialog'
	},
	nsfw: {
		where: 'device',
		default: 'respect' as 'respect' | 'force' | 'ignore'
	},
	animation: {
		where: 'device',
		default: true
	},
	animatedMfm: {
		where: 'device',
		default: true
	},
	loadRawImages: {
		where: 'device',
		default: false
	},
	imageNewTab: {
		where: 'device',
		default: false
	},
	disableShowingAnimatedImages: {
		where: 'device',
		default: false
	},
	disablePagesScript: {
		where: 'device',
		default: false
	},
	useOsNativeEmojis: {
		where: 'device',
		default: false
	},
	useBlurEffectForModal: {
		where: 'device',
		default: true
	},
	showFixedPostForm: {
		where: 'device',
		default: false
	},
	enableInfiniteScroll: {
		where: 'device',
		default: true
	},
	showGapBetweenNotesInTimeline: {
		where: 'device',
		default: true
	},
	darkMode: {
		where: 'device',
		default: false
	},
	instanceTicker: {
		where: 'device',
		default: 'remote' as 'none' | 'remote' | 'always'
	},
	reactionPickerWidth: {
		where: 'device',
		default: 1
	},
	reactionPickerHeight: {
		where: 'device',
		default: 1
	},
	recentlyUsedEmojis: {
		where: 'device',
		default: [] as string[]
	},
	recentlyUsedUsers: {
		where: 'device',
		default: [] as string[]
	},
	defaultSideView: {
		where: 'device',
		default: false
	},
	sidebarDisplay: {
		where: 'device',
		default: 'full' as 'full' | 'icon'
	},
});

// このファイルに書きたくないけどここに書かないと何故かVeturが認識しない
declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$pizzax: typeof defaultStore;
	}
}
