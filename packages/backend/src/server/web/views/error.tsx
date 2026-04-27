/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { comment } from '@/server/web/views/_.js';
import type { CommonPropsMinimum } from '@/server/web/views/_.js';

export function ErrorPage(props: {
	title?: string;
	code: string;
	id: string;
}) {
	return (
		<>
			{'<!DOCTYPE html>'}
			{comment}
			<html>
				<head>
					<meta charset="UTF-8" />
					<meta name="application-name" content="Misskey" />
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<meta name="referrer" content="origin" />
					<title safe>{props.title ?? 'An error has occurred... | Misskey'}</title>
					<link rel="stylesheet" href="/static-assets/misc/error.css" />
					<script src="/static-assets/misc/error.js"></script>
				</head>
				<body>
					<svg
						class="icon-warning"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<path d="M12 9v2m0 4v.01" />
						<path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
					</svg>
					<h1 data-i18n="title">Failed to initialize Misskey</h1>

					<button class="button-big" onclick="location.reload();">
						<span class="button-label-big" data-i18n="reload">Reload</span>
					</button>

					<p data-i18n="serverError">
						If reloading after a period of time does not resolve the problem, contact the server administrator with the following ERROR ID.
					</p>

					<div id="errors">
						<code safe>
							ERROR CODE: {props.code}<br />
							ERROR ID: {props.id}
						</code>
					</div>

					<p><b data-i18n="solution">The following actions may solve the problem.</b></p>

					<p data-i18n="solution1">Update your os and browser</p>
					<p data-i18n="solution2">Disable an adblocker</p>
					<p data-i18n="solution3">Clear your browser cache</p>
					<p data-i18n="solution4">(Tor Browser) Set dom.webaudio.enabled to true</p>

					<details style="color: #86b300;">
						<summary data-i18n="otherOption">Other options</summary>
						<a href="/flush">
							<button class="button-small">
								<span class="button-label-small" data-i18n="otherOption1">Clear preferences and cache</span>
							</button>
						</a>
						<a href="/cli">
							<button class="button-small">
								<span class="button-label-small" data-i18n="otherOption2">Start the simple client</span>
							</button>
						</a>
						<a href="/bios">
							<button class="button-small">
								<span class="button-label-small" data-i18n="otherOption3">Start the repair tool</span>
							</button>
						</a>
					</details>
				</body>
			</html>
		</>
	);
}
