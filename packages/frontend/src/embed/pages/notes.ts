import { embedI18n as i18n } from '../scripts/embed-i18n';
import { dateTimeFormat } from '@/scripts/intl-const';
import '../notes.scss';

//CWボタン
document.getElementById("cw-button")?.addEventListener("click", () => {
    document.getElementById("note-body")?.classList.toggle("hide");
    document.getElementById("cw-info-show")?.classList.toggle("hide");
    document.getElementById("cw-info-hide")?.classList.toggle("hide");
});
document.getElementById("quote-cw-button")?.addEventListener("click", () => {
    document.getElementById("quote-note-body")?.classList.toggle("hide");
    document.getElementById("quote-cw-info-show")?.classList.toggle("hide");
    document.getElementById("quote-cw-info-hide")?.classList.toggle("hide");
});

//時刻（タイムゾーン関連がややこしいのでJSでレンダリング）
document.querySelectorAll("time.locale-string").forEach((el) => {
    const dateTimeRaw = el.getAttribute("datetime");
    const mode = el.getAttribute("data-mi-date-mode");
    if (dateTimeRaw !== null) {
        const _time = new Date(dateTimeRaw).getTime();
        
        const invalid = Number.isNaN(_time);
        const absolute:string = !invalid ? dateTimeFormat.format(_time) : i18n.ts._ago.invalid;
        const now = new Date().getTime();
        
        const relative = () => {
            if (invalid) return i18n.ts._ago.invalid;

            const ago = (now - _time) / 1000/*ms*/;

            return (
                ago >= 31536000 ? i18n.t('_ago.yearsAgo', { n: Math.round(ago / 31536000).toString() }) :
                ago >= 2592000 ? i18n.t('_ago.monthsAgo', { n: Math.round(ago / 2592000).toString() }) :
                ago >= 604800 ? i18n.t('_ago.weeksAgo', { n: Math.round(ago / 604800).toString() }) :
                ago >= 86400 ? i18n.t('_ago.daysAgo', { n: Math.round(ago / 86400).toString() }) :
                ago >= 3600 ? i18n.t('_ago.hoursAgo', { n: Math.round(ago / 3600).toString() }) :
                ago >= 60 ? i18n.t('_ago.minutesAgo', { n: (~~(ago / 60)).toString() }) :
                ago >= 10 ? i18n.t('_ago.secondsAgo', { n: (~~(ago % 60)).toString() }) :
                ago >= -1 ? i18n.ts._ago.justNow :
                i18n.ts._ago.future);
        };

        switch (mode) {
            case 'absolute':
                el.innerHTML = absolute;
                break;
            case 'detailed':
                el.innerHTML = `${absolute} (${relative()})`;
                break;
            case 'relative':
            default:
                el.innerHTML = relative();
                break;
        }
    }
});

export { };
