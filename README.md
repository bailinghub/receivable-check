# Receivable Check

A local AI-assisted workspace for comparing an order-receivable CSV with a receipt CSV. An open-weight model proposes column mappings and explains computed differences. A person confirms the mappings, and deterministic code performs the money calculations.

Built as a new project for the [Hacktoberfest Open-Source AI Challenge, Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12), beginning October 14, 2026.

## The job

Small merchants and bookkeepers repeatedly receive exports with different headings: one system says “Amount due”, another says “到账金额”. Finding which columns to compare is often as tedious as finding the actual differences.

Receivable Check keeps the workflow narrow:

1. Load two CSVs or the clearly labelled synthetic demonstration.
2. Ask the local model to suggest reference, amount and currency columns.
3. Review and confirm those mappings.
4. Compare exact references and money values using deterministic rules.
5. Inspect each finding's source file, row evidence and calculation.
6. Request an optional explanation of the evidence and export the report.

A suggested match is a comparison between supplied reports. It does not establish that money reached a bank account. The tool never changes accounting records or initiates payments.

## Run locally

Requires Node.js 22 or newer and an official [Ollama](https://ollama.com/download) installation.

```sh
ollama serve
ollama pull qwen3:4b
git clone https://github.com/bailinghub/receivable-check.git
cd receivable-check
npm start
```

Open **http://127.0.0.1:4317**. Keep Ollama running at its default loopback endpoint. The application has no npm runtime dependencies.

```sh
npm test
```

The deterministic tests do not download a model or require Ollama. AI steps display a real error if local inference is unavailable; manual mapping remains explicit.

## Why the open model matters

[Qwen3-4B](https://huggingface.co/Qwen/Qwen3-4B) supplies the semantic column suggestions and evidence explanations through [Ollama's local chat API](https://docs.ollama.com/api/chat). These are real inference calls, with structured-output validation. There are no fixed “AI answers” or external model API keys.

After the runtime and model are downloaded, this comparison workflow can run on the laptop. CSV content is sent only to the local inference service. The app serves its own UI and fonts locally and includes no analytics or CDN scripts.

The AI does not calculate authoritative totals. Unrecognized columns, invented evidence references and invalid structured output are rejected. The app also blocks a finite set of numeric and payment-finality assertions. These checks do not prove that every natural-language sentence is grounded; suggestions and explanations still require human review.

## Scope

The first version compares one order row with one receipt row using an exact business reference, a supported currency and decimal money values. Both files must represent the same intended comparison period. It reports matching amounts, under/over amounts, records present on one side only, and cases requiring review.

Duplicate references, split receipts, missing keys, malformed money values and unsupported currency cases remain visible for review. It does not silently sum split payments, infer settlement timing, reconcile refunds or fees, or turn a missing row into zero money.

UTF-8 CSVs, including BOMs, are limited to 2 MiB and 5,000 data rows per file. Quoted fields and newlines are parsed as CSV records, with source line references preserved. Uploads and reports stay in bounded in-memory storage; restarting the app clears them. A changed input requires a new report.

This is a prototype for a potentially paid local setup/support service. No paid customers or production financial validation are claimed.

## Evidence and boundaries

- [Public acceptance notes](docs/public-acceptance.md)
- [Third-party notices](docs/THIRD_PARTY_NOTICES.md)
- Synthetic examples under [examples/](examples/)

This repository contains only this independent application. It does not bundle BailingHub Core, ACC, a commercial Host, or private client code. Its local workflow belongs to the application.

Application code is MIT licensed. Model weights are downloaded separately under their own license and are not included in this repository.
