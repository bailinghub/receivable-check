const $ = (id) => document.getElementById(id);
const MAX_BYTES = 2 * 1024 * 1024;
const roles = ['orders', 'receipts'];
const fields = ['reference', 'amount', 'currency'];
const strings = {
  en: {
    localBadge: 'Local-first workspace',
    eyebrow: 'THE WEEKLY CHECK, WITH A PAPER TRAIL',
    title: 'The numbers should add up.\nWhen they don’t, know why.',
    description: 'Bring your orders and receipts. Local AI suggests the columns; you confirm them. Exact arithmetic finds the differences, with every result linked to its source rows.',
    modelHeading: 'OPEN MODEL · ON THIS MACHINE',
    modelNote: 'CSV analysis uses this app and your loopback Ollama service. No hosted AI API.',
    refreshModel: 'Check connection ↗',
    stepImport: 'Bring two CSVs', stepMap: 'Confirm the meaning', stepReview: 'Review the evidence',
    importKicker: '01 / THE SOURCE FILES', importHeading: 'Start with the two sides of the story.',
    loadDemo: 'Load synthetic demo', uploadLimits: 'UTF-8 CSV · up to 2 MiB and 5,000 rows per file · synthetic demo contains no real merchant data',
    ordersTitle: 'Orders · amount due', ordersSubtitle: 'What you expected to receive',
    receiptsTitle: 'Receipts · amount received', receiptsSubtitle: 'What the payment report says',
    chooseOrders: 'Choose orders CSV', chooseReceipts: 'Choose receipts CSV', dropHint: 'or drop a file here',
    mapFields: 'Map the three fields', suggestMapping: 'Suggest with local AI', confirmMapping: 'Confirm mapping',
    scopeHeading: 'Confirm what this check can tell you.',
    scopeDescription: 'One order row, one payment row, the same currency per pair and the same reporting period. Multiple currencies are never totalled or converted. Split payments, refunds, fees, duplicates and currency conflicts need a person to review the context.',
    scopeConfirm: 'I confirm both files use this comparison scope.',
    runCheck: 'Run the check', runHint: 'Confirm both mappings and scope first.',
    resultsKicker: '03 / THE REVIEW', resultsHeading: 'Every difference has a source.',
    exportCSV: '↓ CSV report', exportHTML: '↓ HTML report', findingsHeading: 'Reconciliation findings',
    reference: 'Reference', amount: 'Amount', currency: 'Currency', expected: 'Expected', received: 'Received', result: 'Result',
    showMore: 'Show the next 100 findings', tableFootnote: 'A difference is a prompt to investigate. It is not proof of a loss, a payment, or a corrected ledger.',
    evidenceHeading: 'Follow the evidence.', evidenceEmpty: 'Select a finding to inspect the original rows, file digests and calculation.',
    explainHeading: 'Turn the evidence into a review note.',
    explainDescription: 'Local AI explains up to 3 differences using the computed evidence. Invalid references and structured output are rejected. AI notes still need human review.',
    explainButton: 'Explain with local AI',
    footer: 'Read-only analysis. No money moves. No books are changed. Files stay with this local app; model weights are served by Ollama.',
    selectColumn: 'Select a column…', mapManual: 'Manual · awaiting confirmation', mapSuggested: 'AI suggested · review first',
    mapConfirmedAI: 'AI suggestion · confirmed', mapConfirmedManual: 'Manual · confirmed', confirmed: '✓ Confirmed',
    modelChecking: 'Checking local model…', modelReady: 'Ready for local inference', modelUnavailable: 'Local model unavailable',
    modelFailed: 'Unable to check local model', mappingRunning: 'Local model is reading the column names…',
    inferenceElapsed: '{seconds}s elapsed · actual local inference', suggestionDetails: '{model} · {seconds}s · AI-generated mapping suggestion',
    manualAvailable: 'AI did not produce a usable suggestion. You may map the columns manually; this is not an AI result.',
    columnsMustDiffer: 'Select three different columns before confirming.', mappingDone: '{role} mapping confirmed. Review the other file and comparison scope.',
    fileInfo: '{rows} data rows · {size} · UTF-8 CSV', fileTooLarge: 'Each file must be no larger than 2 MiB.',
    invalidUtf8: 'This file is not valid UTF-8. Export a UTF-8 CSV and try again.',
    emptyCSV: 'The CSV needs a header and at least one data row.', invalidCSV: 'The CSV has an unfinished quoted field.',
    invalidHeaders: 'Use non-empty, unique column names. Rename duplicate or blank headers before uploading.',
    demoLoaded: 'Synthetic demo loaded. Run the two local AI mappings, review them, then confirm the comparison scope.',
    loadingDemo: 'Loading synthetic files…', replacedFile: 'File changed. Previous report and this file’s AI suggestion were cleared.',
    runReady: 'Mappings confirmed. Scope confirmed.', runBusy: 'Checking with exact arithmetic…', runFinished: 'Check complete. Select a finding to inspect its source evidence.',
    reportMeta: '{count} findings · generated {time} · report {id}',
    matched: 'Matched', under: 'Received less', over: 'Received more', missing: 'One side missing', duplicate: 'Duplicate', manual: 'Manual review',
    allFilter: 'All', reviewFilter: 'To review', matchedFilter: 'Matched', noFindings: 'No findings in this view.',
    missingKey: 'Missing reference', invalidAmount: 'Invalid amount', currencyMismatch: 'Currency conflict', unknownStatus: 'Needs review',
    noReference: '(missing reference)', unknownAmount: 'Not confirmed', rowLabel: 'Source row {line}', rowRange: 'Source rows {line}–{end}',
    originalValues: 'Original values', digestLabel: 'SHA-256 · original file', calculationLabel: 'DETERMINISTIC CALCULATION',
    noCalculation: 'No valid single-row comparison. The evidence needs manual review.',
    orderSource: 'Orders', receiptSource: 'Receipts', noSources: 'No corresponding source row.',
    reviewNote: 'Local AI review note', recommendedCheck: 'Next check: ', citedRows: 'Cited evidence: ',
    explanationRunning: 'Local model is reading the calculated evidence…', explanationMeta: '{model} · {seconds}s · {count} AI review notes; {remaining} remaining for manual review',
    explanationFailed: 'No AI explanation was accepted. The computed findings are still available for manual review.',
    noExplanationItems: 'The model returned no review notes. The computed findings are unchanged.',
    explainAfterReview: 'Run the check before requesting AI review notes.', errorPrefix: 'Could not complete this step: ',
    staleResponse: 'The input changed while processing. Run this step again with the current files.',
    mapMissing: 'Confirm the mappings and comparison scope before running the check.',
    invoiceRole: 'Orders', receiptsRole: 'Receipts', loading: 'Working…',
    filesAndMapping: 'Two source files loaded; mappings need confirmation.',
    confirmedCount: '{count}/2 mappings confirmed.', retryConnection: 'Local inference can take longer on the first request while the model loads.',
    unsupportedType: 'Please choose a CSV file.',
    tooManyRows: 'Each file is limited to 5,000 data rows.', tooManyColumns: 'Each file needs 3 to 80 columns.',
    mixedCurrency: 'These files contain multiple currencies. Each pair is checked only in its own identical currency; there is no combined total or currency conversion.',
  },
  zh: {
    localBadge: '本机只读核对工作台',
    eyebrow: '每周核对，每一项都有依据',
    title: '金额应该对得上。\n对不上，也要知道为什么。',
    description: '导入订单与收款表。本地 AI 建议字段映射，你来确认。程序准确核算差异，每项结果都能回到原文件和源行。',
    modelHeading: '开放模型 · 在本机运行',
    modelNote: 'CSV 分析由本应用及本机 Ollama 完成，不使用托管 AI API。',
    refreshModel: '检查连接 ↗',
    stepImport: '导入两份 CSV', stepMap: '确认字段含义', stepReview: '核对结果依据',
    importKicker: '01 / 原始文件', importHeading: '先把核对的两边放在一起。',
    loadDemo: '加载合成演示', uploadLimits: 'UTF-8 CSV · 每份最多 2 MiB、5,000 行 · 合成演示不含真实商家数据',
    ordersTitle: '订单表 · 应收金额', ordersSubtitle: '原本应该收到多少',
    receiptsTitle: '收款表 · 实收金额', receiptsSubtitle: '收款流水记录了什么',
    chooseOrders: '选择订单 CSV', chooseReceipts: '选择收款 CSV', dropHint: '也可以把文件拖到这里',
    mapFields: '确认三个对应字段', suggestMapping: '让本地 AI 建议映射', confirmMapping: '确认映射',
    scopeHeading: '确认这次核对采用的口径。',
    scopeDescription: '每笔同币种、同一期、单行对应。不同币种不合计、不兑换。拆分收款、退款、手续费、重复参考号和币种冲突都需要人工确认背景。',
    scopeConfirm: '我确认两份表采用上述核对口径。',
    runCheck: '开始核对', runHint: '先确认两份映射和核对口径。',
    resultsKicker: '03 / 核对结果', resultsHeading: '每一个差异，都有来源。',
    exportCSV: '↓ CSV 报告', exportHTML: '↓ HTML 报告', findingsHeading: '核对清单',
    reference: '业务参考号', amount: '金额', currency: '币种', expected: '应收', received: '实收', result: '结果',
    showMore: '显示接下来的 100 项', tableFootnote: '差异提示需要核对，并不证明损失、真实到账或账本已经修正。',
    evidenceHeading: '顺着依据看。', evidenceEmpty: '选择一项结果，查看原始行、文件摘要和核算式。',
    explainHeading: '把核算依据转成待核对说明。',
    explainDescription: '本地 AI 依据程序算出的证据解释最多 3 项差异。无效引用和结构化输出会被拒绝，AI 说明仍需人工审阅。',
    explainButton: '让本地 AI 解释差异',
    footer: '只读分析，不转账，不改账。文件由本机应用处理，模型权重由 Ollama 在本机提供。',
    selectColumn: '选择对应列…', mapManual: '手动映射 · 待确认', mapSuggested: 'AI 建议 · 请先审阅',
    mapConfirmedAI: 'AI 建议 · 已确认', mapConfirmedManual: '手动映射 · 已确认', confirmed: '✓ 已确认',
    modelChecking: '正在检查本地模型…', modelReady: '本地推理已就绪', modelUnavailable: '本地模型暂不可用',
    modelFailed: '未能核实本地模型连接', mappingRunning: '本地模型正在识别字段含义…',
    inferenceElapsed: '已用 {seconds} 秒 · 真实本地推理', suggestionDetails: '{model} · {seconds} 秒 · AI 生成的映射建议',
    manualAvailable: 'AI 未给出可用建议。你可以手动选择字段；这条路径不算 AI 结果。',
    columnsMustDiffer: '确认前请选择三个不同的字段。', mappingDone: '{role}映射已确认。请审阅另一份文件及核对口径。',
    fileInfo: '{rows} 行数据 · {size} · UTF-8 CSV', fileTooLarge: '每份文件不能超过 2 MiB。',
    invalidUtf8: '文件不是有效 UTF-8，请重新导出 UTF-8 CSV。',
    emptyCSV: 'CSV 需要表头及至少一行数据。', invalidCSV: 'CSV 中有未闭合的引号字段。',
    invalidHeaders: '请使用非空且不重复的列名，重命名重复或空白表头后再导入。',
    demoLoaded: '合成演示已加载。请分别运行本地 AI 映射，审阅后确认映射和核对口径。',
    loadingDemo: '正在读取合成文件…', replacedFile: '文件已更换，原报告及此文件的 AI 建议已清除。',
    runReady: '两份映射和核对口径已确认。', runBusy: '正在按确定规则核算…', runFinished: '核对完成。选择一项查看源行和核算依据。',
    reportMeta: '{count} 项结果 · 生成于 {time} · 报告 {id}',
    matched: '金额一致', under: '实收较少', over: '实收较多', missing: '单边缺行', duplicate: '重复参考号', manual: '人工核对',
    allFilter: '全部', reviewFilter: '待核对', matchedFilter: '一致', noFindings: '当前分类没有结果。',
    missingKey: '参考号缺失', invalidAmount: '金额无效', currencyMismatch: '币种冲突', unknownStatus: '需要核对',
    noReference: '（参考号缺失）', unknownAmount: '未确认', rowLabel: '源行 {line}', rowRange: '源行 {line}–{end}',
    originalValues: '原始字段值', digestLabel: 'SHA-256 · 原文件摘要', calculationLabel: '确定性核算',
    noCalculation: '无法形成有效的单行比较，需要人工核对。',
    orderSource: '订单表', receiptSource: '收款表', noSources: '没有对应的源行。',
    reviewNote: '本地 AI 核对说明', recommendedCheck: '下一步核对：', citedRows: '引用依据：',
    explanationRunning: '本地模型正在阅读核算依据…', explanationMeta: '{model} · {seconds} 秒 · {count} 条 AI 核对说明；其余 {remaining} 项需人工核对',
    explanationFailed: '没有 AI 说明通过校验；程序核算结果仍可人工查看。',
    noExplanationItems: '模型没有返回核对说明，原核算结果没有变化。',
    explainAfterReview: '请先完成核对，再请求 AI 说明。', errorPrefix: '此步骤未完成：',
    staleResponse: '处理期间输入已变化，请使用当前文件重新运行此步骤。',
    mapMissing: '请先确认映射及核对口径，再运行核对。',
    invoiceRole: '订单表', receiptsRole: '收款表', loading: '处理中…',
    filesAndMapping: '两份源文件已导入，仍需确认映射。',
    confirmedCount: '已确认 {count}/2 份映射。', retryConnection: '首次推理需加载模型，可能耗时较长。',
    unsupportedType: '请选择 CSV 文件。',
    tooManyRows: '每份文件最多 5,000 行数据。', tooManyColumns: '每份文件需要 3 至 80 列。',
    mixedCurrency: '两份表含多个币种，只逐笔比较相同币种，不提供跨币种总额或汇率换算。',
  },
};

const emptySource = () => ({ csv: '', filename: '', bytes: 0, headers: [], rows: [], document: null, mapping: {}, confirmed: false, ai: null, reason: '', aiError: '', revision: 0, suggestionApplied: false });
const state = { language: 'en', sources: { orders: emptySource(), receipts: emptySource() }, report: null, selected: null, filter: 'review', shown: 100, explanations: new Map(), explanationAI: null, explanationError: '', explanationAttempted: false, explanationOmitted: 0, busy: null, revision: 0, model: null };
const t = (key, values = {}) => {
  let value = strings[state.language][key] ?? strings.en[key] ?? key;
  for (const [name, replacement] of Object.entries(values)) value = value.replaceAll(`{${name}}`, String(replacement));
  return value;
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function announce(message, error = false) {
  $('notice').textContent = message;
  $('notice').className = `notice${error ? ' error' : ''}`;
}

function clearNotice() { $('notice').className = 'notice hidden'; $('notice').textContent = ''; }

function safeError(error) {
  const message = typeof error?.message === 'string' ? error.message : 'Request failed';
  return message.slice(0, 700);
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 240000);
  try {
    const response = await fetch(path, { ...options, signal: controller.signal, headers: { ...options.headers, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } });
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.error?.message ?? result.message ?? `HTTP ${response.status}`);
      error.code = result.error?.code;
      error.document = result.document;
      throw error;
    }
    return result;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(state.language === 'zh' ? '请求超时，请检查本机模型后重试。' : 'Request timed out. Check the local model before retrying.');
    throw error;
  } finally { clearTimeout(timeout); }
}

function post(path, body) { return request(path, { method: 'POST', body: JSON.stringify(body) }); }

function parseCSV(csv) {
  const rows = [];
  let row = [], cell = '', quoted = false, afterQuote = false, started = false;
  const finishCell = () => { row.push(cell); cell = ''; afterQuote = false; };
  const finishRow = () => {
    finishCell();
    if (started || row.length > 1 || row[0] !== '') rows.push(row);
    row = []; started = false;
  };
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (quoted) {
      if (char === '"') {
        if (csv[i + 1] === '"') { cell += '"'; i++; }
        else { quoted = false; afterQuote = true; }
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && csv[i + 1] === '\n') i++;
        cell += '\n';
      } else cell += char;
      continue;
    }
    if (afterQuote && ![',', '\n', '\r'].includes(char)) throw new Error(t('invalidCSV'));
    if (char === '"') {
      if (cell || afterQuote) throw new Error(t('invalidCSV'));
      quoted = true; started = true;
    } else if (char === ',') { finishCell(); started = true; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && csv[i + 1] === '\n') i++;
      finishRow();
    } else { cell += char; started = true; }
  }
  if (quoted) throw new Error(t('invalidCSV'));
  if (started || row.length || cell || afterQuote) finishRow();
  if (rows.length < 2) throw new Error(t('emptyCSV'));
  const headers = rows[0].map((value) => value.trim());
  if (headers.length < 3 || headers.length > 80) throw new Error(t('tooManyColumns'));
  if (rows.length > 5001) throw new Error(t('tooManyRows'));
  if (headers.some((value) => !value) || new Set(headers).size !== headers.length) throw new Error(t('invalidHeaders'));
  return { headers, rows: rows.slice(1) };
}

function invalidateReport() {
  state.revision++;
  state.report = null; state.selected = null; state.explanations.clear();
  state.explanationAI = null; state.explanationError = ''; state.explanationAttempted = false; state.explanationOmitted = 0;
  $('results').classList.add('hidden');
  $('download-csv').removeAttribute('href'); $('download-html').removeAttribute('href');
  updateWorkflow();
}

function replaceSource(role, csv, filename, bytes) {
  const decoded = csv.replace(/^\uFEFF/, '');
  const parsed = parseCSV(decoded);
  const nextRevision = state.sources[role].revision + 1;
  state.sources[role] = { ...emptySource(), csv, filename, bytes, ...parsed, revision: nextRevision };
  $('confirm-assumptions').checked = false;
  invalidateReport();
  renderSource(role);
  updateWorkflow();
}

async function loadFile(role, file) {
  if (!file) return;
  try {
    if (file.size > MAX_BYTES) throw new Error(t('fileTooLarge'));
    if (!/\.csv$/i.test(file.name)) throw new Error(t('unsupportedType'));
    const buffer = await file.arrayBuffer();
    let csv;
    // Preserve a UTF-8 BOM in the transmitted text so SHA-256 names the original bytes.
    try { csv = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer); }
    catch { throw new Error(t('invalidUtf8')); }
    replaceSource(role, csv, file.name, file.size);
    announce(t('replacedFile'));
  } catch (error) { announce(safeError(error), true); }
  finally { $(`${role}-file`).value = ''; }
}

async function loadDemo() {
  const button = $('load-demo');
  button.disabled = true; button.classList.add('busy'); clearNotice();
  try {
    const responses = await Promise.all(roles.map((role) => fetch(`/examples/${role}.csv`)));
    if (responses.some((response) => !response.ok)) throw new Error('Synthetic example files are unavailable.');
    const contents = await Promise.all(responses.map((response) => response.text()));
    roles.forEach((role, i) => replaceSource(role, contents[i], `${role}.csv`, new TextEncoder().encode(contents[i]).length));
    announce(t('demoLoaded'));
  } catch (error) { announce(t('errorPrefix') + safeError(error), true); }
  finally { button.disabled = false; button.classList.remove('busy'); }
}

function renderSource(role) {
  const source = state.sources[role];
  $(`${role}-drop`).classList.toggle('loaded', Boolean(source.csv));
  $(`${role}-file-label`).textContent = source.filename || t(role === 'orders' ? 'chooseOrders' : 'chooseReceipts');
  $(`${role}-file-info`).textContent = source.csv ? t('fileInfo', { rows: source.document?.rowCount ?? source.rows.length, size: source.bytes >= 1024 ? `${(source.bytes / 1024).toFixed(1)} KiB` : `${source.bytes} B` }) : t('dropHint');
  $(`${role}-preview`).classList.toggle('hidden', !source.csv);
  $(`${role}-mapping`).classList.toggle('hidden', !source.csv);
  $(`${role}-preview`).replaceChildren();
  if (!source.csv) return;
  const table = element('table', 'preview-table');
  const header = element('tr');
  for (const name of source.headers) header.append(element('th', '', name));
  const thead = element('thead'); thead.append(header); table.append(thead);
  const tbody = element('tbody');
  for (const values of source.rows.slice(0, 2)) {
    const row = element('tr');
    for (let index = 0; index < source.headers.length; index++) row.append(element('td', '', values[index] ?? ''));
    tbody.append(row);
  }
  table.append(tbody); $(`${role}-preview`).append(table);
  const fieldPanel = $(`${role}-fields`); fieldPanel.replaceChildren();
  for (const field of fields) {
    const label = element('label', 'mapping-field'); label.append(element('span', '', t(field)));
    const select = element('select');
    select.id = `${role}-${field}`;
    select.dataset.testid = `${role}-map-${field}`;
    const placeholder = element('option', '', t('selectColumn')); placeholder.value = ''; select.append(placeholder);
    for (const name of source.headers) { const option = element('option', '', name); option.value = name; select.append(option); }
    select.value = source.mapping[field] ?? '';
    select.addEventListener('change', () => {
      source.mapping[field] = select.value;
      source.confirmed = false;
      source.revision++;
      source.ai = null; source.reason = ''; source.aiError = '';
      source.suggestionApplied = false;
      invalidateReport(); renderMappingStatus(role); updateWorkflow();
    });
    label.append(select); fieldPanel.append(label);
  }
  renderMappingStatus(role);
}

function renderMappingStatus(role) {
  const source = state.sources[role];
  const status = $(`${role}-map-status`);
  const button = $(`${role}-mapping-confirm`);
  const aiSuggestion = Boolean(source.ai && source.suggestionApplied);
  status.textContent = source.confirmed ? t(aiSuggestion ? 'mapConfirmedAI' : 'mapConfirmedManual') : t(aiSuggestion ? 'mapSuggested' : 'mapManual');
  status.className = `tiny-status${source.confirmed ? ' confirmed' : ''}`;
  button.textContent = source.confirmed ? t('confirmed') : t('confirmMapping');
  button.classList.toggle('confirmed', source.confirmed);
  button.disabled = !validMapping(source.mapping) || state.busy?.role === role;
  const meta = $(`${role}-ai-meta`);
  if (state.busy?.role === role) return;
  meta.className = `ai-meta${source.aiError ? ' error' : ''}`;
  if (source.aiError) meta.textContent = `${source.aiError}\n${t('manualAvailable')}`;
  else if (source.ai) meta.textContent = `${t('suggestionDetails', { model: source.ai.model ?? state.model?.model ?? 'Local model', seconds: seconds(source.ai.elapsedMs) })}${source.reason ? `\n${source.reason}` : ''}`;
  else meta.textContent = '';
}

function validMapping(mapping) { return fields.every((field) => Boolean(mapping[field])) && new Set(fields.map((field) => mapping[field])).size === fields.length; }
function seconds(elapsed) { return (Number(elapsed || 0) / 1000).toFixed(1); }

function setBusy(operation) {
  state.busy = operation;
  for (const role of roles) {
    $(`${role}-mapping-btn`).disabled = Boolean(operation) || !state.sources[role].csv;
    $(`${role}-mapping-btn`).classList.toggle('busy', operation?.role === role);
    $(`${role}-mapping-confirm`).disabled = !validMapping(state.sources[role].mapping) || operation?.role === role;
  }
  $('explain-report').disabled = Boolean(operation) || !state.report;
  $('explain-report').classList.toggle('busy', operation?.kind === 'explain');
  $('reconcile').classList.toggle('busy', operation?.kind === 'reconcile');
  updateWorkflow();
}

async function suggestMapping(role) {
  const source = state.sources[role];
  if (!source.csv || state.busy) return;
  const revision = source.revision;
  source.confirmed = false;
  invalidateReport();
  const busy = { kind: 'mapping', role, start: Date.now() };
  setBusy(busy); clearNotice();
  const meta = $(`${role}-ai-meta`); meta.className = 'ai-meta running';
  const updateTimer = () => { meta.textContent = `${t('mappingRunning')}\n${t('inferenceElapsed', { seconds: seconds(Date.now() - busy.start) })}\n${t('retryConnection')}`; };
  updateTimer(); const timer = setInterval(updateTimer, 1000);
  try {
    const response = await post('/api/mapping', { role, csv: source.csv, filename: source.filename, language: state.language });
    if (state.sources[role].revision !== revision) throw new Error(t('staleResponse'));
    if (!response.suggestion || !fields.every((field) => source.headers.includes(response.suggestion[field])) || !validMapping(response.suggestion)) throw new Error('The model did not return three valid, distinct columns.');
    source.document = response.document;
    source.mapping = Object.fromEntries(fields.map((field) => [field, response.suggestion[field]]));
    source.ai = response.ai; source.reason = response.suggestion.reason ?? ''; source.aiError = '';
    source.suggestionApplied = true; source.confirmed = false;
    invalidateReport(); renderSource(role);
  } catch (error) {
    if (state.sources[role].revision === revision) {
      source.document = error.document ?? source.document;
      source.ai = null; source.reason = ''; source.aiError = safeError(error); source.suggestionApplied = false; source.confirmed = false;
      renderMappingStatus(role);
      announce(t('errorPrefix') + safeError(error), true);
    } else announce(t('staleResponse'), true);
  } finally { clearInterval(timer); setBusy(null); renderMappingStatus(role); }
}

function confirmMapping(role) {
  const source = state.sources[role];
  if (!validMapping(source.mapping)) { announce(t('columnsMustDiffer'), true); return; }
  source.confirmed = true;
  renderMappingStatus(role); updateWorkflow();
  announce(t('mappingDone', { role: t(role === 'orders' ? 'invoiceRole' : 'receiptsRole') }));
}

function updateWorkflow() {
  const loaded = roles.filter((role) => state.sources[role].csv).length;
  const confirmed = roles.filter((role) => state.sources[role].confirmed).length;
  const ready = loaded === 2 && confirmed === 2 && $('confirm-assumptions').checked;
  $('reconcile').disabled = !ready || Boolean(state.busy);
  $('run-hint').textContent = state.busy?.kind === 'reconcile' ? t('runBusy') : ready ? t('runReady') : t('runHint');
  $('step-import').className = `step ${loaded === 2 ? 'done' : 'current'}`;
  $('step-map').className = `step ${state.report ? 'done' : loaded === 2 ? 'current' : ''}`;
  $('step-review').className = `step ${state.report ? 'current' : ''}`;
  for (const role of roles) $(`${role}-mapping-btn`).disabled = Boolean(state.busy) || !state.sources[role].csv;
}

async function reconcile() {
  if (!roles.every((role) => state.sources[role].confirmed) || !$('confirm-assumptions').checked || state.busy) { announce(t('mapMissing'), true); return; }
  const revision = state.revision;
  setBusy({ kind: 'reconcile' }); clearNotice();
  try {
    const payload = Object.fromEntries(roles.map((role) => {
      const { csv, filename, mapping } = state.sources[role]; return [role, { csv, filename, mapping }];
    }));
    const { report } = await post('/api/reconcile', payload);
    if (state.revision !== revision) throw new Error(t('staleResponse'));
    if (!report?.id || !Array.isArray(report.findings)) throw new Error('The server returned an invalid report.');
    state.report = report; state.explanations.clear(); state.explanationAI = null; state.explanationError = ''; state.explanationAttempted = false; state.explanationOmitted = 0;
    state.filter = report.findings.some((item) => item.status !== 'same') ? 'review' : 'all'; state.shown = 100;
    state.selected = report.findings.find((item) => item.status !== 'same')?.id ?? report.findings[0]?.id ?? null;
    renderReport(); announce(t('runFinished'));
    $('results').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  } catch (error) { announce(t('errorPrefix') + safeError(error), true); }
  finally { setBusy(null); }
}

function statusInfo(status) {
  const statuses = {
    same: ['matched', 'same'], under: ['under', 'under'], over: ['over', 'over'],
    'one-side-missing': ['missing', 'missing'], duplicate: ['duplicate', 'duplicate'],
    'missing-key': ['missingKey', 'manual'], 'invalid-amount': ['invalidAmount', 'manual'],
    'currency-mismatch': ['currencyMismatch', 'manual'],
  };
  const [key, type] = statuses[status] ?? ['unknownStatus', 'manual'];
  return { label: t(key), type };
}

function money(value, currency) { return value === null || value === undefined ? '—' : `${currency ? `${currency} ` : ''}${value}`; }

function renderReport() {
  if (!state.report) return;
  const report = state.report;
  $('results').classList.remove('hidden');
  const time = new Date(report.createdAt).toLocaleString(state.language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  $('report-meta').textContent = t('reportMeta', { count: report.findings.length, time, id: String(report.id).slice(0, 8) });
  $('download-csv').href = `/api/reports/${encodeURIComponent(report.id)}/export?format=csv`;
  $('download-html').href = `/api/reports/${encodeURIComponent(report.id)}/export?format=html`;
  $('currency-warning').classList.toggle('hidden', !report.scope?.mixedCurrencyWarning);
  $('currency-warning').textContent = report.scope?.mixedCurrencyWarning ? t('mixedCurrency') : '';
  const counts = report.findings.reduce((value, item) => { value[item.status] = (value[item.status] ?? 0) + 1; return value; }, {});
  const manual = report.findings.filter((item) => !['same', 'under', 'over', 'one-side-missing', 'duplicate'].includes(item.status)).length;
  const summaries = [['matched', 'same', counts.same ?? 0], ['under', 'under', counts.under ?? 0], ['over', 'over', counts.over ?? 0], ['missing', 'missing', counts['one-side-missing'] ?? 0], ['duplicate', 'duplicate', counts.duplicate ?? 0], ['manual', 'manual', manual]];
  $('summary').replaceChildren(...summaries.map(([label, type, count]) => {
    const card = element('div', 'summary-card'); card.dataset.testid = `summary-${type}`;
    card.append(element('strong', '', count));
    const caption = element('span', 'summary-label'); caption.append(element('span', `status-dot ${type}`), element('span', '', t(label))); card.append(caption); return card;
  }));
  renderFilters(); renderFindings(); renderEvidence(); renderExplanations(); updateWorkflow();
}

function renderFilters() {
  $('filters').replaceChildren();
  for (const [filter, label] of [['review', 'reviewFilter'], ['all', 'allFilter'], ['same', 'matchedFilter']]) {
    const button = element('button', `filter-button${state.filter === filter ? ' active' : ''}`, t(label));
    button.type = 'button'; button.dataset.testid = `filter-${filter}`; button.setAttribute('aria-pressed', String(state.filter === filter));
    button.addEventListener('click', () => { state.filter = filter; state.shown = 100; renderFilters(); renderFindings(); });
    $('filters').append(button);
  }
}

function renderFindings() {
  if (!state.report) return;
  const filtered = state.report.findings.filter((item) => state.filter === 'all' || (state.filter === 'review' ? item.status !== 'same' : item.status === 'same'));
  $('findings').replaceChildren();
  for (const item of filtered.slice(0, state.shown)) {
    const info = statusInfo(item.status);
    const row = element('button', `finding-row ${item.status}${state.selected === item.id ? ' selected' : ''}`);
    row.type = 'button'; row.dataset.testid = `finding-${item.id}`; row.dataset.status = item.status;
    row.setAttribute('aria-pressed', String(state.selected === item.id));
    row.append(element('span', 'finding-reference', item.reference || t('noReference')),
      element('span', 'finding-money', money(item.expected, item.currency)),
      element('span', 'finding-money', money(item.received, item.currency)));
    const result = element('span', 'finding-status'); result.append(element('span', `status-dot ${info.type}`), element('span', '', info.label)); row.append(result);
    row.addEventListener('click', () => selectFinding(item.id)); $('findings').append(row);
  }
  if (!filtered.length) $('findings').append(element('div', 'empty-filter', t('noFindings')));
  $('show-more').classList.toggle('hidden', filtered.length <= state.shown);
}

function selectFinding(id) {
  state.selected = id; renderFindings(); renderEvidence();
  if (window.innerWidth < 781) $('evidence').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderEvidence() {
  const finding = state.report?.findings.find((item) => item.id === state.selected);
  $('evidence').replaceChildren();
  if (!finding) {
    const empty = element('div', 'evidence-empty'); empty.append(element('span', '', '↗'), element('h3', '', t('evidenceHeading')), element('p', '', t('evidenceEmpty'))); $('evidence').append(empty); return;
  }
  const info = statusInfo(finding.status);
  const panel = element('div', 'evidence-content'); panel.dataset.testid = 'finding-evidence';
  const kicker = element('div', 'evidence-kicker'); kicker.append(element('span', `status-dot ${info.type}`), element('span', '', t('evidenceHeading')));
  panel.append(kicker, element('h3', '', finding.reference || t('noReference')), element('p', 'evidence-status', info.label));
  const calculation = element('div', 'calculation'); calculation.dataset.testid = 'finding-calculation';
  calculation.append(element('span', 'calculation-label', t('calculationLabel')), element('span', '', finding.calculation || t('noCalculation'))); panel.append(calculation);
  if (finding.issues?.length) { const list = element('ul', 'evidence-issues'); for (const issue of finding.issues) list.append(element('li', '', issue)); panel.append(list); }
  for (const role of roles) {
    const rows = Array.isArray(finding[role]) ? finding[role] : [];
    if (!rows.length) { const section = element('div', 'source-evidence'); section.append(element('h4', '', t(role === 'orders' ? 'orderSource' : 'receiptSource')), element('p', 'source-line-label', t('noSources'))); panel.append(section); }
    for (const row of rows) {
      const section = element('section', 'source-evidence'); section.dataset.testid = `source-row-${role}-${row.line}`;
      section.append(element('h4', '', `${t(role === 'orders' ? 'orderSource' : 'receiptSource')} · ${row.filename ?? state.report.documents?.[role]?.filename ?? ''}`));
      const label = row.endLine > row.line ? t('rowRange', { line: row.line, end: row.endLine }) : t('rowLabel', { line: row.line });
      const lineLabel = element('div', 'source-line-label'); lineLabel.append(element('span', '', label), element('span', '', t('originalValues'))); section.append(lineLabel);
      const values = element('dl', 'source-values');
      for (const [column, value] of Object.entries(row.values ?? {})) values.append(element('dt', '', column), element('dd', '', value));
      section.append(values);
      const digest = element('details', 'digest');
      digest.append(element('summary', '', t('digestLabel')), element('p', '', row.documentSha256 ?? state.report.documents?.[role]?.sha256 ?? ''));
      section.append(digest); panel.append(section);
    }
  }
  const explanation = state.explanations.get(finding.id);
  if (explanation) {
    const section = element('section', 'evidence-ai'); section.append(element('h4', '', t('reviewNote')), element('p', '', explanation.explanation), element('p', 'recommended-check', t('recommendedCheck') + explanation.recommendedCheck)); panel.append(section);
  }
  $('evidence').append(panel);
}

async function explain() {
  if (!state.report || state.busy) return;
  const reportId = state.report.id;
  const busy = { kind: 'explain', start: Date.now() }; setBusy(busy); clearNotice();
  state.explanationError = '';
  const meta = $('explain-meta'); meta.className = 'ai-meta running';
  const updateTimer = () => { meta.textContent = `${t('explanationRunning')} ${t('inferenceElapsed', { seconds: seconds(Date.now() - busy.start) })}`; };
  updateTimer(); const timer = setInterval(updateTimer, 1000);
  try {
    const response = await post('/api/explain', { reportId, language: state.language });
    if (state.report?.id !== reportId) throw new Error(t('staleResponse'));
    if (!Array.isArray(response.items)) throw new Error('The model returned an invalid review-note response.');
    const allowed = new Set(state.report.findings.map((item) => item.id));
    if (response.items.some((item) => !allowed.has(item.findingId))) throw new Error('The model referenced a finding outside this report.');
    state.explanations = new Map(response.items.map((item) => [item.findingId, item]));
    state.explanationAI = response.ai; state.explanationError = ''; state.explanationAttempted = true;
    state.explanationOmitted = Number.isSafeInteger(response.omittedCount) && response.omittedCount >= 0 ? response.omittedCount : 0;
  } catch (error) {
    if (state.report?.id === reportId) { state.explanations.clear(); state.explanationAI = null; state.explanationError = safeError(error); state.explanationAttempted = true; state.explanationOmitted = 0; }
    announce(t('errorPrefix') + safeError(error), true);
  } finally { clearInterval(timer); setBusy(null); renderExplanations(); renderEvidence(); }
}

function renderExplanations() {
  const panel = $('explain-items'); panel.replaceChildren(); panel.classList.toggle('hidden', !state.explanations.size);
  const meta = $('explain-meta'); meta.className = `ai-meta${state.explanationError ? ' error' : ''}`;
  if (state.busy?.kind === 'explain') return;
  if (state.explanationError) meta.textContent = `${state.explanationError}\n${t('explanationFailed')}`;
  else if (state.explanationAI) meta.textContent = state.explanations.size ? t('explanationMeta', { model: state.explanationAI.model ?? 'Local model', seconds: seconds(state.explanationAI.elapsedMs), count: state.explanations.size, remaining: state.explanationOmitted }) : t('noExplanationItems');
  else if (state.explanationAttempted) meta.textContent = t('noExplanationItems');
  else meta.textContent = '';
  for (const [id, item] of state.explanations) {
    const finding = state.report.findings.find((entry) => entry.id === id);
    if (!finding) continue;
    const card = element('article', 'explanation-card'); card.dataset.testid = `explanation-${id}`;
    const title = element('button', '', `${finding.reference || t('noReference')} ↗`); title.type = 'button'; title.addEventListener('click', () => selectFinding(id));
    card.append(title, element('p', '', item.explanation), element('p', 'recommended-check', t('recommendedCheck') + item.recommendedCheck));
    const citations = (item.evidence ?? []).map((row) => `${t(row.role === 'orders' ? 'orderSource' : 'receiptSource')} ${row.line}`).join(' · ');
    card.append(element('small', '', t('citedRows') + citations)); panel.append(card);
  }
}

async function refreshModel() {
  $('refresh-model').disabled = true; $('model-state').textContent = t('modelChecking'); $('model-state').className = 'model-status pending';
  try {
    state.model = await request('/api/health'); renderModel();
  } catch (error) {
    state.model = { modelReady: false, error: safeError(error), model: state.model?.model ?? 'qwen3:4b' };
    $('model-state').textContent = t('modelFailed'); $('model-state').className = 'model-status offline'; $('model-state').title = safeError(error);
  } finally { $('refresh-model').disabled = false; }
}

function renderModel() {
  const model = state.model;
  $('model-name').textContent = model?.model ?? 'Qwen3 · 4B';
  $('model-state').textContent = !model ? t('modelChecking') : t(model.modelReady ? 'modelReady' : 'modelUnavailable');
  $('model-state').className = `model-status ${!model ? 'pending' : model.modelReady ? 'ready' : 'offline'}`;
  $('model-state').title = model?.modelDigest ? `Model digest: ${model.modelDigest}` : typeof model?.error === 'string' ? model.error : '';
}

function setLanguage(language) {
  state.language = language; document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = language === 'zh' ? 'Receivable Check · 本地 AI，有据可查的核对' : 'Receivable Check · Local AI, traceable numbers';
  for (const node of document.querySelectorAll('[data-i18n]')) {
    const text = t(node.dataset.i18n);
    if (node.id === 'page-title') {
      const [first, second] = text.split('\n'); node.replaceChildren(document.createTextNode(first), document.createElement('br'), document.createTextNode(second ?? ''));
    } else node.textContent = text;
  }
  $('language-toggle').textContent = language === 'en' ? '中文' : 'EN';
  $('language-toggle').setAttribute('aria-label', language === 'en' ? 'Switch language to Chinese' : '切换到英文');
  roles.forEach(renderSource); renderModel(); updateWorkflow();
  if (state.report) renderReport();
  clearNotice();
}

for (const role of roles) {
  $(`${role}-file`).addEventListener('change', (event) => loadFile(role, event.target.files[0]));
  $(`${role}-mapping-btn`).addEventListener('click', () => suggestMapping(role));
  $(`${role}-mapping-confirm`).addEventListener('click', () => confirmMapping(role));
  const drop = $(`${role}-drop`);
  drop.addEventListener('keydown', (event) => { if (event.target === drop && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); $(`${role}-file`).click(); } });
  drop.addEventListener('dragover', (event) => { event.preventDefault(); drop.classList.add('drag-over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
  drop.addEventListener('drop', (event) => { event.preventDefault(); drop.classList.remove('drag-over'); loadFile(role, event.dataTransfer.files[0]); });
}
$('load-demo').addEventListener('click', loadDemo);
$('confirm-assumptions').addEventListener('change', () => {
  if (!$('confirm-assumptions').checked) invalidateReport();
  updateWorkflow();
});
$('reconcile').addEventListener('click', reconcile);
$('explain-report').addEventListener('click', explain);
$('show-more').addEventListener('click', () => { state.shown += 100; renderFindings(); });
$('refresh-model').addEventListener('click', refreshModel);
$('language-toggle').addEventListener('click', () => setLanguage(state.language === 'en' ? 'zh' : 'en'));
setLanguage('en');
refreshModel();
