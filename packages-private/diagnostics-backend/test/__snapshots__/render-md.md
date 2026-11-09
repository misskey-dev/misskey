## ⚙️ Backend Diagnostics Report

### Summary

| Metric | @&nbsp;Base | @&nbsp;Head | Δ | MAD |
| --- | ---: | ---: | ---: | ---: |
| **Process memory (USS)** | 184 MB <br> ± 1 MB | 200 MB <br> ± 1 MB | $\color{orange}{\text{+16~MB}}$<br>$\color{orange}{\text{+8.7\\%}}$ | 1.4 MB |
| **JS heap (snapshot total)** | 40 MB <br> ± 200 KB | 44 MB <br> ± 200 KB | $\color{orange}{\text{+3.2 MB}}$<br>$\color{orange}{\text{+7.9\\%}}$ | 283 KB |

Use these rows to judge whether memory usage actually changed. Uncolored deltas are within the measurement noise.

<details>
<summary>How to read this report</summary>

- **Process memory (USS)**: Memory that belongs only to this process (its private pages), as seen by the OS. This is what would be freed if the process exited, and it includes everything (JS heap, native allocations, code). It is noisy, so small changes often stay within the noise.
- **JS heap (snapshot total)**: Total size of the objects reachable from JavaScript, taken from a V8 heap snapshot after GC. Strings stored outside the V8 heap are counted at their real size. It has little noise, so it is the best signal for small changes. It does not include native memory that is not held by JS objects.
- **HeapUsed / External** (`process.memoryUsage()`): Breakdown only; do not judge a change by them alone. The same data can move between the two. For example, Node.js keeps a module source longer than about 1 M characters outside the V8 heap, and `External` can report only about half of its real size. A change that makes a bundle chunk cross that size can raise HeapUsed and lower External even when total memory went down.
- **PSS**: Like USS, plus a proportional share of the memory shared with other processes (e.g. shared libraries).
</details>

### Memory breakdown: After GC
| Metric | @&nbsp;Base | @&nbsp;Head | Δ | MAD |
| --- | ---: | ---: | ---: | ---: |
| **HeapUsed** | 152 MB <br> ± 1 MB | 168 MB <br> ± 1 MB | $\color{orange}{\text{+16~MB}}$<br>$\color{orange}{\text{+10.5\\%}}$ | 1.4 MB |
| **PSS** | 202 MB <br> ± 1 MB | 218 MB <br> ± 1 MB | $\color{orange}{\text{+16~MB}}$<br>$\color{orange}{\text{+7.9\\%}}$ | 1.4 MB |

<small><i>Only metrics showing significant changes are displayed.</i></small>


### V8 Heap Snapshot Statistics

| Metric | @&nbsp;Base | @&nbsp;Head | Δ | MAD |
| --- | ---: | ---: | ---: | ---: |
| $\color{gray}{\rule{8pt}{8pt}}$ **Total** | 40 MB <br> ± 200 KB | 44 MB <br> ± 200 KB | $\color{orange}{\text{+3.2 MB}}$<br>$\color{orange}{\text{+7.9\\%}}$ | 283 KB |
| | | | | |
| $\color{orange}{\rule{8pt}{8pt}}$ **Code** | 4.7 MB | 5.1 MB | $\color{orange}{\text{+376 KB}}$ | 33 KB |
| $\color{red}{\rule{8pt}{8pt}}$ **Strings** | 4.4 MB | 4.8 MB | $\color{orange}{\text{+352 KB}}$ | 31 KB |
| $\color{cyan}{\rule{8pt}{8pt}}$ **JS arrays** | 4.1 MB | 4.5 MB | $\color{orange}{\text{+328 KB}}$ | 29 KB |
| $\color{green}{\rule{8pt}{8pt}}$ **Typed arrays** | 3.8 MB | 4.1 MB | $\color{orange}{\text{+304 KB}}$ | 27 KB |
| $\color{yellow}{\rule{8pt}{8pt}}$ **System objects** | 3.5 MB | 3.8 MB | $\color{orange}{\text{+280 KB}}$ | 25 KB |
| $\color{violet}{\rule{8pt}{8pt}}$ **Other JS objs** | 3.2 MB | 3.5 MB | $\color{orange}{\text{+256 KB}}$ | 23 KB |
| $\color{pink}{\rule{8pt}{8pt}}$ **Other non-JS objs** | 2.9 MB | 3.2 MB | $\color{orange}{\text{+232 KB}}$ | 21 KB |


Download representative heap snapshot: [base](https://example.invalid/base) / [head](https://example.invalid/head)

⚠️ **Warning**: Memory usage (PSS) has increased by more than 5% and exceeds the observed sample noise. Please verify this is not an unintended change.

