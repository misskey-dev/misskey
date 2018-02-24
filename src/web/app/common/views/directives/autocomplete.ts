import * as getCaretCoordinates from 'textarea-caret';
import MkAutocomplete from '../components/autocomplete.vue';

export default {
	bind(el, binding, vn) {
		const self = el._autoCompleteDirective_ = {} as any;
		self.x = new Autocomplete(el);
		self.x.attach();
	},

	unbind(el, binding, vn) {
		const self = el._autoCompleteDirective_;
		self.x.detach();
	}
};

/**
 * オートコンプリートを管理するクラス。
 */
class Autocomplete {
	private suggestion: any;
	private textarea: any;

	/**
	 * 対象のテキストエリアを与えてインスタンスを初期化します。
	 */
	constructor(textarea) {
		//#region BIND
		this.onInput = this.onInput.bind(this);
		this.complete = this.complete.bind(this);
		this.close = this.close.bind(this);
		//#endregion

		this.suggestion = null;
		this.textarea = textarea;
	}

	/**
	 * このインスタンスにあるテキストエリアの入力のキャプチャを開始します。
	 */
	public attach() {
		this.textarea.addEventListener('input', this.onInput);
	}

	/**
	 * このインスタンスにあるテキストエリアの入力のキャプチャを解除します。
	 */
	public detach() {
		this.textarea.removeEventListener('input', this.onInput);
		this.close();
	}

	/**
	 * テキスト入力時
	 */
	private onInput() {
		this.close();

		const caret = this.textarea.selectionStart;
		const text = this.textarea.value.substr(0, caret);

		const mentionIndex = text.lastIndexOf('@');
		const emojiIndex = text.lastIndexOf(':');

		if (mentionIndex != -1 && mentionIndex > emojiIndex) {
			const username = text.substr(mentionIndex + 1);
			if (!username.match(/^[a-zA-Z0-9-]+$/)) return;
			this.open('user', username);
		}

		if (emojiIndex != -1 && emojiIndex > mentionIndex) {
			const emoji = text.substr(emojiIndex + 1);
			if (!emoji.match(/^[\+\-a-z_]+$/)) return;
			this.open('emoji', emoji);
		}
	}

	/**
	 * サジェストを提示します。
	 */
	private open(type, q) {
		// 既に開いているサジェストは閉じる
		this.close();

		//#region サジェストを表示すべき位置を計算
		const caretPosition = getCaretCoordinates(this.textarea, this.textarea.selectionStart);

		const rect = this.textarea.getBoundingClientRect();

		const x = rect.left + caretPosition.left - this.textarea.scrollLeft;
		const y = rect.top + caretPosition.top - this.textarea.scrollTop;
		//#endregion

		// サジェスト要素作成
		this.suggestion = new MkAutocomplete({
			propsData: {
				textarea: this.textarea,
				complete: this.complete,
				close: this.close,
				type: type,
				q: q,
				x,
				y
			}
		}).$mount();

		// 要素追加
		document.body.appendChild(this.suggestion.$el);
	}

	/**
	 * サジェストを閉じます。
	 */
	private close() {
		if (this.suggestion == null) return;

		this.suggestion.$destroy();
		this.suggestion = null;

		this.textarea.focus();
	}

	/**
	 * オートコンプリートする
	 */
	private complete(type, value) {
		this.close();

		const caret = this.textarea.selectionStart;

		if (type == 'user') {
			const source = this.textarea.value;

			const before = source.substr(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf('@'));
			const after = source.substr(caret);

			// 挿入
			this.textarea.value = trimmedBefore + '@' + value.username + ' ' + after;

			// キャレットを戻す
			this.textarea.focus();
			const pos = caret + value.username.length;
			this.textarea.setSelectionRange(pos, pos);
		} else if (type == 'emoji') {
			const source = this.textarea.value;

			const before = source.substr(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf(':'));
			const after = source.substr(caret);

			// 挿入
			this.textarea.value = trimmedBefore + value + after;

			// キャレットを戻す
			this.textarea.focus();
			const pos = caret + value.length;
			this.textarea.setSelectionRange(pos, pos);
		}
	}
}
