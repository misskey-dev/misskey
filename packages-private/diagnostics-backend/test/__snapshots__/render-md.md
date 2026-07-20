## ⚙️ Backend Diagnostics Report

### Memory: After GC
| Metric | Base | Head | Δ median | Δ MAD | Δ min | Δ max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **HeapUsed** | 152 MB <br> ± 1 MB | 168 MB <br> ± 1 MB | $\color{orange}{\text{+16 MB}}$<br>$\color{orange}{\text{+10.5\\%}}$ | 0 MB | $\color{orange}{\text{+16 MB}}$ | $\color{orange}{\text{+16 MB}}$ |
| **PSS** | 202 MB <br> ± 1 MB | 218 MB <br> ± 1 MB | $\color{orange}{\text{+16 MB}}$<br>$\color{orange}{\text{+7.9\\%}}$ | 0 MB | $\color{orange}{\text{+16 MB}}$ | $\color{orange}{\text{+16 MB}}$ |
| **USS** | 184 MB <br> ± 1 MB | 200 MB <br> ± 1 MB | $\color{orange}{\text{+16 MB}}$<br>$\color{orange}{\text{+8.7\\%}}$ | 0 MB | $\color{orange}{\text{+16 MB}}$ | $\color{orange}{\text{+16 MB}}$ |
| **External** | 8.2 MB <br> ± 0.1 MB | 8.2 MB <br> ± 0.1 MB | 0 MB<br>0% | 0 MB | 0 MB | 0 MB |

### V8 Heap Snapshot Statistics

| Metric | Base | Head | Δ median | Δ MAD | Δ min | Δ max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| $\color{gray}{\rule{8pt}{8pt}}$ **Total** | 40 MB <br> ± 200 KB | 44 MB <br> ± 200 KB | $\color{orange}{\text{+3.2 MB}}$<br>$\color{orange}{\text{+7.9\\%}}$ | 0 B | $\color{orange}{\text{+3.2 MB}}$ | $\color{orange}{\text{+3.2 MB}}$ |
| | | | | | | |
| <details><summary>$\color{orange}{\rule{8pt}{8pt}}$ **Code**</summary>11.8% → 11.8%</details> | 4.7 MB | 5.1 MB | $\color{orange}{\text{+376 KB}}$ | 0 B | $\color{orange}{\text{+376 KB}}$ | $\color{orange}{\text{+376 KB}}$ |
| <details><summary>$\color{red}{\rule{8pt}{8pt}}$ **Strings**</summary>11% → 11%</details> | 4.4 MB | 4.8 MB | $\color{orange}{\text{+352 KB}}$ | 0 B | $\color{orange}{\text{+352 KB}}$ | $\color{orange}{\text{+352 KB}}$ |
| <details><summary>$\color{cyan}{\rule{8pt}{8pt}}$ **JS arrays**</summary>10.3% → 10.3%</details> | 4.1 MB | 4.5 MB | $\color{orange}{\text{+328 KB}}$ | 0 B | $\color{orange}{\text{+328 KB}}$ | $\color{orange}{\text{+328 KB}}$ |
| <details><summary>$\color{green}{\rule{8pt}{8pt}}$ **Typed arrays**</summary>9.5% → 9.5%</details> | 3.8 MB | 4.1 MB | $\color{orange}{\text{+304 KB}}$ | 0 B | $\color{orange}{\text{+304 KB}}$ | $\color{orange}{\text{+304 KB}}$ |
| <details><summary>$\color{yellow}{\rule{8pt}{8pt}}$ **System objects**</summary>8.8% → 8.8%</details> | 3.5 MB | 3.8 MB | $\color{orange}{\text{+280 KB}}$ | 0 B | $\color{orange}{\text{+280 KB}}$ | $\color{orange}{\text{+280 KB}}$ |
| <details><summary>$\color{violet}{\rule{8pt}{8pt}}$ **Other JS objs**</summary>8% → 8%</details> | 3.2 MB | 3.5 MB | $\color{orange}{\text{+256 KB}}$ | 0 B | $\color{orange}{\text{+256 KB}}$ | $\color{orange}{\text{+256 KB}}$ |
| <details><summary>$\color{pink}{\rule{8pt}{8pt}}$ **Other non-JS objs**</summary>7.3% → 7.3%</details> | 2.9 MB | 3.2 MB | $\color{orange}{\text{+232 KB}}$ | 0 B | $\color{orange}{\text{+232 KB}}$ | $\color{orange}{\text{+232 KB}}$ |


Download representative heap snapshot: [base](https://example.invalid/base) / [head](https://example.invalid/head)

⚠️ **Warning**: Memory usage (PSS) has increased by more than 5% and exceeds the observed sample noise. Please verify this is not an unintended change.

