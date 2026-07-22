## ⚙️ Backend Diagnostics Report

### Memory: After GC
| Metric | @ Base | @ Head | Δ | MAD |
| --- | ---: | ---: | ---: | ---: |
| **HeapUsed** | 152 MB <br> ± 1 MB | 168 MB <br> ± 1 MB | $\color{orange}{\text{+16 MB}}$<br>$\color{orange}{\text{+10.5\\%}}$ | 1.4 MB |
| **PSS** | 202 MB <br> ± 1 MB | 218 MB <br> ± 1 MB | $\color{orange}{\text{+16 MB}}$<br>$\color{orange}{\text{+7.9\\%}}$ | 1.4 MB |
| **USS** | 184 MB <br> ± 1 MB | 200 MB <br> ± 1 MB | $\color{orange}{\text{+16 MB}}$<br>$\color{orange}{\text{+8.7\\%}}$ | 1.4 MB |

<small><i>Only metrics showing significant changes are displayed.</i></small>


### V8 Heap Snapshot Statistics

| Metric | @ Base | @ Head | Δ | MAD |
| --- | ---: | ---: | ---: | ---: |
| $\color{gray}{\rule{8pt}{8pt}}$ **Total** | 40 MB <br> ± 200 KB | 44 MB <br> ± 200 KB | $\color{orange}{\text{+3.2 MB}}$<br>$\color{orange}{\text{+7.9\\%}}$ | 283 KB |
| | | | | |
| $\color{orange}{\rule{8pt}{8pt}}$ **Code** | 4.7 MB | 5.1 MB | $\color{orange}{\text{+376 KB}}$ | 33 KB |
| $\color{red}{\rule{8pt}{8pt}}$ **Strings** | 4.4 MB | 4.8 MB | $\color{orange}{\text{+352 KB}}$ | 31 KB |
| $\color{cyan}{\rule{8pt}{8pt}}$ **JS arrays** | 4.1 MB | 4.5 MB | $\color{orange}{\text{+328 KB}}$ | 29 KB |
| $\color{green}{\rule{8pt}{8pt}}$ **Typed arrays** | 3.8 MB | 4.1 MB | $\color{orange}{\text{+304 KB}}$ | 27 KB |
| $\color{yellow}{\rule{8pt}{8pt}}$ **System objects** | 3.5 MB | 3.8 MB | $\color{orange}{\text{+280 KB}}$ | 25 KB |
| $\color{violet}{\rule{8pt}{8pt}}$ **Other JS objs** | 3.2 MB | 3.5 MB | $\color{orange}{\text{+256 KB}}$ | 23 KB |
| $\color{pink}{\rule{8pt}{8pt}}$ **Other non-JS objs** | 2.9 MB | 3.2 MB | $\color{orange}{\text{+232 KB}}$ | 21 KB |


Download representative heap snapshot: [base](https://example.invalid/base) / [head](https://example.invalid/head)

⚠️ **Warning**: Memory usage (PSS) has increased by more than 5% and exceeds the observed sample noise. Please verify this is not an unintended change.

