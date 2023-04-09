import { locale } from "@/config";
import { I18n } from "@/scripts/i18n";

const i18n = new I18n(locale);

export const embedI18n = i18n;

/**
 * 非vueページ向け翻訳適用関数
 * 
 * キー指定例:
 * ```html
 * <span data-mi-i18n="翻訳key（必須）" data-mi-i18n-ctx=" *JSON Objectで動的な値を指定（任意）* ">
 *   <element>
 *     ...
 *       <element data-mi-i18n-target=" *動的な値を入れたい要素にkeyを指定* "></element>
 *     ...
 *   </element>
 * </span>
 * ```
 */
export function embedInitI18n() {
	const els: NodeListOf<HTMLElement> = document.querySelectorAll("[data-mi-i18n]");
	els.forEach((tag: HTMLElement) => {
		const key: string[] | null = tag.dataset.miI18n?.split('.') ?? null;
		const translationContext: Record<string, string | number> | null = JSON.parse(tag.dataset.miI18nCtx ?? 'null');
		if (!key) {
			console.warn("[i18n] Key doesn't exist!", tag);
		} else if (translationContext) {
			let hasTranslationTarget: boolean = false;
			let output: string = key.reduce((o, i) => o[i], i18n.ts);
			Object.keys(translationContext).forEach((item) => {
				const templateTag: NodeListOf<HTMLElement> = tag.querySelectorAll(`[data-mi-i18n-target="${item}"]`);
				if (templateTag.length > 0) {
					hasTranslationTarget = true;
					templateTag.forEach((target: HTMLElement) => {
						target.innerText = translationContext[item].toString();
						let parent: HTMLElement = target;
						while (parent.parentElement != null && parent.parentElement !== tag) {
							if (parent.parentElement != null) {
								parent = parent.parentElement;
							}
						}
						output = output.replace(new RegExp(`{\s*${item}\s*}`), parent.outerHTML);
					});
				}
			});
			if (!hasTranslationTarget) {
				tag.innerText = i18n.t(key.join('.'), translationContext);
			} else {
				tag.innerHTML = output;
			}
		} else {
			tag.innerText = key.reduce((o, i) => o[i], i18n.ts);
		}
	});
}
