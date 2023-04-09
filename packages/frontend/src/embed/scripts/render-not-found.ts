import { instanceName } from "@/config";
import { embedI18n as i18n } from '../scripts/embed-i18n';

export function renderNotFound() {
    const el = document.getElementById("container");
    if (el) {
        el.innerHTML = `<div id="error">
            <div>
                <div id="instance-info">
                    <a class="click-anime" href="http://localhost:3000" target="_blank">
                        <img src="/static-assets/splash.png" class="_anime_bounce_standBy">
                        <span class="sr-only">${ i18n.t('aboutX', { x: instanceName || 'Misskey' }) }</span>
                    </a>
                </div>
                <img class="main" src="https://xn--931a.moe/assets/not-found.jpg">
                <h2>${ i18n.ts.notFound }</h2>
                <p>${ i18n.ts.notFoundDescription }</p>
            </div>
        </div>`;
    }
}
