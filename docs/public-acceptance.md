# Public acceptance notes

Observed October 14, 2026. These are maintainer checks on synthetic inputs, not an independent audit, a general model benchmark, or production financial validation.

## Reproduce

Follow the root README to start Node.js and Ollama with `qwen3:4b`. Run `npm test`, then open the app and load the synthetic demo. Ask for each column mapping, inspect and confirm both, confirm the comparison scope and run the check. Inspect the source rows, request the optional AI review notes, and download CSV/HTML reports.

The original model distribution used for these checks was `qwen3:4b`, Q4_K_M, 4.0B parameters, with digest `359d7dd4bcdab3d86b87d73ac27966f4dbb9f5efdfcc75d34a8764a09474fae7`. A mutable tag may later resolve differently. The runtime was official Ollama 0.40.3, on an Apple M4 with 16 GiB memory. Weights and binaries are installed separately, not committed here.

## Deterministic checks

27 tests passed, with zero failures and zero skips. Tests cover the prewritten synthetic expectations, CSV quoting/BOM/source lines and limits, exact money precision, absent and duplicate rows, unsupported currencies, report cache expiry and bounds, safe exports, local request guards, and model response/reference validation.

The demo contains nine order rows and nine receipt rows. It yields ten findings: two matching amounts, one received-less, one received-more, two one-sided records, one duplicate reference, one missing reference, one invalid amount and one currency conflict. Eight findings need review.

For SO-1002, the visible calculation is `109.00 - 119.00 = -10.00 CNY`, naming source line 3 in each file. For SO-1005, two receipt rows (40.00 and 60.00) remain separate; the application does not add them together and declare a match. Missing counterpart amounts remain unknown. Multiple currencies produce a warning and no combined total or conversion.

## Real inference and browser checks

Four minimal English/Chinese header mapping requests selected the expected columns. Application API requests then accepted both English mappings in 2.363s and 2.702s. A subsequent browser run used real local inference: both mappings were correct, displayed at 5.8s and 3.8s; the three evidence notes completed in 16.2s and were manually checked. These are single-machine observations, not latency promises or evidence about arbitrary merchant exports.

The browser showed the confirmation gate, expected findings, source-row arithmetic, preserved duplicate evidence and currency warning. Both actual report downloads were inspected. Changing the confirmed comparison scope hid the previous report, removed its export links and disabled a new check until reconfirmed. English and Chinese interface labels were inspected; model notes keep the language in which they were requested.

Earlier model outputs included a nonexistent column and inaccurate prose when asked for eight review notes. We rejected unusable structured output and narrowed the explanation task to at most three prioritized findings, using existing header enums and a bounded evidence-only prompt. The remaining findings stay visible for manual review. A separate final three-note API run completed in 11.417s with the expected row references and manually reviewed wording.

Structured schemas, exact references and finite assertion guards do not validate all possible natural-language claims. Human review remains required. A model error leaves deterministic findings available; it does not produce a fabricated fallback AI answer.

## Limits

No real merchant data, paid customer, external adoption, bank settlement confirmation or production bookkeeping integration was tested. Pricing and demand for a local setup/support service remain hypotheses. This application performs read-only comparisons; it cannot initiate payment or modify a ledger.

The recorded demo uses synthetic data and real local requests. The application and model use loopback endpoints; initial runtime/model downloads need network access. Local hardware, electricity and support still have costs.
