## 🖥 Frontend Diagnostics Report

| Metric | @ Base | @ Head | Δ | MAD |
| --- | ---: | ---: | ---: | ---: |
| **Encoded network** | 1 MB <br> ± 10 KB | 1.1 MB <br> ± 11 KB | $\color{orange}{\text{+83 KB}}$<br>$\color{orange}{\text{+8\\%}}$ | 15 KB |
| **Decoded body** | 3.5 MB <br> ± 34 KB | 3.7 MB <br> ± 37 KB | $\color{orange}{\text{+277 KB}}$<br>$\color{orange}{\text{+8\\%}}$ | 50 KB |
| **Same-origin encoded** | 1 MB <br> ± 10 KB | 1.1 MB <br> ± 11 KB | $\color{orange}{\text{+82 KB}}$<br>$\color{orange}{\text{+8\\%}}$ | 15 KB |
| **Script encoded** | 918 KB <br> ± 9 KB | 991 KB <br> ± 9.7 KB | $\color{orange}{\text{+73 KB}}$<br>$\color{orange}{\text{+8\\%}}$ | 13 KB |
| **Page-attributed memory** | 92 MB <br> ± 900 KB | 99 MB <br> ± 972 KB | $\color{orange}{\text{+7.3 MB}}$<br>$\color{orange}{\text{+8\\%}}$ | 1.3 MB |

<small><i>Only metrics showing significant changes are displayed.</i></small>

[View details](https://example.invalid/html)

<details>
<summary>Requests by resource type</summary>

<table>
<thead>
<tr>
<th rowspan="2">Type</th>
<th colspan="3">Requests</th>
<th colspan="3">Encoded bytes</th>
</tr>
<tr>
<th>Base</th>
<th>Head</th>
<th>Δ</th>
<th>Base</th>
<th>Head</th>
<th>Δ</th>
</tr>
</thead>
<tbody>
<tr>
<td><b>Script</b></td>
<td align="right">10</td>
<td align="right">10</td>
<td align="right">0</td>
<td align="right">918 KB</td>
<td align="right">991 KB</td>
<td align="right">$\color{orange}{\text{+73 KB}}$</td>
</tr>
<tr>
<td><b>Stylesheet</b></td>
<td align="right">2</td>
<td align="right">2</td>
<td align="right">0</td>
<td align="right">82 KB</td>
<td align="right">88 KB</td>
<td align="right">$\color{orange}{\text{+6.5 KB}}$</td>
</tr>
<tr>
<td><b>Fetch</b></td>
<td align="right">6</td>
<td align="right">6</td>
<td align="right">0</td>
<td align="right">41 KB</td>
<td align="right">44 KB</td>
<td align="right">$\color{orange}{\text{+3.3 KB}}$</td>
</tr>
</tbody>
</table>

</details>

<details>
<summary>V8 heap snapshot statistics</summary>

| Metric | @ Base | @ Head | Δ | MAD |
| --- | ---: | ---: | ---: | ---: |
| $\color{gray}{\rule{8pt}{8pt}}$ **Total** | 1 MB <br> ± 10 KB | 1.1 MB <br> ± 11 KB | $\text{+82 KB}$<br>$\text{+8\\%}$ | 15 KB |
| | | | | |
| $\color{orange}{\rule{8pt}{8pt}}$ **Code** | 2 MB | 2.2 MB | $\color{orange}{\text{+163 KB}}$ | 29 KB |
| $\color{red}{\rule{8pt}{8pt}}$ **Strings** | 3.1 MB | 3.3 MB | $\color{orange}{\text{+245 KB}}$ | 44 KB |
| $\color{cyan}{\rule{8pt}{8pt}}$ **JS arrays** | 4.1 MB | 4.4 MB | $\color{orange}{\text{+326 KB}}$ | 59 KB |
| $\color{green}{\rule{8pt}{8pt}}$ **Typed arrays** | 5.1 MB | 5.5 MB | $\color{orange}{\text{+408 KB}}$ | 74 KB |
| $\color{yellow}{\rule{8pt}{8pt}}$ **System objects** | 6.1 MB | 6.6 MB | $\color{orange}{\text{+490 KB}}$ | 88 KB |
| $\color{violet}{\rule{8pt}{8pt}}$ **Other JS objs** | 7.1 MB | 7.7 MB | $\color{orange}{\text{+571 KB}}$ | 103 KB |
| $\color{pink}{\rule{8pt}{8pt}}$ **Other non-JS objs** | 8.2 MB | 8.8 MB | $\color{orange}{\text{+653 KB}}$ | 118 KB |

Download representative heap snapshot: [base](https://example.invalid/base) / [head](https://example.invalid/head)
</details>

## 📦 Bundle Stats

<details>
<summary>Chunk size diff (2 updated, 0 added, 0 removed)</summary>

| Chunk | Base | Head | Δ | Δ (%) |
| --- | ---: | ---: | ---: | ---: |
| (total) | 120 KB | 127 KB | $\color{orange}{\text{+6.3 KB}}$ | $\color{orange}{\text{+5.2\\%}}$ |
| | | | | |
| <details><summary>`vue`</summary> `assets/vue-b2.js` </details> | 90 KB | 96 KB | $\color{orange}{\text{+6 KB}}$ | $\color{orange}{\text{+6.7\\%}}$ |
| (other generated chunks) | 1.2 KB | 1.5 KB | $\text{+300 B}$ | $\color{orange}{\text{+25\\%}}$ |
| (other) | 20 KB | 20 KB | $\text{+3 B}$ | $\text{+0\\%}$ |

</details>

<details>
<summary>Startup chunk size (2 updated, 0 added, 0 removed)</summary>

| Chunk | Base | Head | Δ | Δ (%) |
| --- | ---: | ---: | ---: | ---: |
| (total) | 114 KB | 120 KB | $\color{orange}{\text{+6 KB}}$ | $\color{orange}{\text{+5.3\\%}}$ |
| | | | | |
| <details><summary>`vue`</summary> `assets/vue-b2.js` </details> | 90 KB | 96 KB | $\color{orange}{\text{+6 KB}}$ | $\color{orange}{\text{+6.7\\%}}$ |
| (other) | 24 KB | 24 KB | $\text{+3 B}$ | $\text{+0\\%}$ |

_Startup chunks are the Vite entry for `src/_boot_.ts` and its static imports._

</details>


<table>
<thead>
<tr>
<th rowspan="2"></th>
<th rowspan="2">Bundles</th>
<th rowspan="2">Modules</th>
<th rowspan="2">Entries</th>
<th colspan="2">Imports</th>
<th colspan="3">Size</th>
</tr>
<tr>
<th>Static</th>
<th>Dynamic</th>
<th>Rendered</th>
<th>Gzip</th>
<th>Brotli</th>
</tr>
</thead>
<tbody>
<tr>
<th><b>Base</b></th>
<td>2</td>
<td>6</td>
<td>1</td>
<td>2</td>
<td>3</td>
<td>21 KB</td>
<td>6.3 KB</td>
<td>5.3 KB</td>
</tr>
<tr>
<th><b>Head</b></th>
<td>2</td>
<td>7</td>
<td>1</td>
<td>3</td>
<td>3</td>
<td>31 KB</td>
<td>8.4 KB</td>
<td>7 KB</td>
</tr>
<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr>
<th><b>Δ</b></th>
<td>0</td>
<td>$\color{orange}{\text{+1}}$</td>
<td>0</td>
<td>$\color{orange}{\text{+1}}$</td>
<td>0</td>
<td>$\color{orange}{\text{+9.8 KB}}$</td>
<td>$\color{orange}{\text{+2.1 KB}}$</td>
<td>$\color{orange}{\text{+1.8 KB}}$</td>
</tr>
<tr>
<th><b>Δ (%)</b></th>
<td>0%</td>
<td>$\color{orange}{\text{+16.7\%}}$</td>
<td>0%</td>
<td>$\color{orange}{\text{+50\%}}$</td>
<td>0%</td>
<td>$\color{orange}{\text{+46.7\%}}$</td>
<td>$\color{orange}{\text{+33.3\%}}$</td>
<td>$\color{orange}{\text{+33.3\%}}$</td>
</tr>
</tbody>
</table>

[Open treemap HTML](https://example.invalid/treemap)
