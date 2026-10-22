import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/constants.dart';
import '../../core/ids.dart';
import '../../core/money.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/store.dart';
import '../../widgets/form_fields.dart';
import '../../widgets/pdf_pane.dart';
import '../../widgets/template_grid.dart';

class DocumentEditorPage extends StatefulWidget {
  const DocumentEditorPage({
    super.key,
    required this.kind,
    this.existingInvoice,
    this.existingReceipt,
  });

  final DocKind kind;
  final Invoice? existingInvoice;
  final Receipt? existingReceipt;

  @override
  State<DocumentEditorPage> createState() => _DocumentEditorPageState();
}

class _DocumentEditorPageState extends State<DocumentEditorPage> {
  late DocumentData data;
  String category = '';
  InvoiceStatus status = InvoiceStatus.draft;
  String? clientId;
  String? error;
  bool saving = false;
  int step = 0;
  bool previewOpen = false;

  bool get isInvoice => widget.kind == DocKind.invoice;
  bool get editing => widget.existingInvoice != null || widget.existingReceipt != null;

  @override
  void initState() {
    super.initState();
    final store = context.read<LedgerStore>();
    if (widget.existingInvoice != null) {
      data = widget.existingInvoice!.data;
      status = widget.existingInvoice!.status;
      clientId = widget.existingInvoice!.clientId;
      category = widget.existingInvoice!.category ?? '';
      step = 1;
    } else if (widget.existingReceipt != null) {
      data = widget.existingReceipt!.data ?? const DocumentData();
      category = widget.existingReceipt!.category ?? '';
      step = 1;
    } else {
      data = DocumentData(
        date: todayIso(),
        dueDate: isInvoice ? dueInDays(store.profile.invoiceDueDays) : '',
        vendor: isInvoice ? store.profile.asParty : const Party(),
        customer: const Party(),
        items: [LineItem.blank()],
        currency: store.profile.defaultCurrency,
        language: store.profile.defaultLanguage,
        template: store.profile.defaultTemplate,
        taxPercent: store.profile.defaultTaxPercent,
      );
      _assignNumber(store);
    }
  }

  Future<void> _assignNumber(LedgerStore store) async {
    final n = await store.peekNumber(isInvoice ? 'INV' : 'RCPT');
    if (mounted) setState(() => data = data.copyWith(number: n));
  }

  Future<void> _save({InvoiceStatus? as}) async {
    if (isInvoice) {
      if (data.customer.name.trim().isEmpty && (storePartyNameEmpty())) {
        setState(() => error = 'Please enter a client / customer name.');
        return;
      }
    } else if (data.vendor.name.trim().isEmpty) {
      setState(() => error = 'Please enter the vendor / shop name.');
      return;
    }
    if (!data.items.any((i) => i.description.trim().isNotEmpty && i.unitPrice > 0)) {
      setState(() => error = 'Add at least one item with a description and price.');
      return;
    }
    setState(() {
      error = null;
      saving = true;
    });
    final store = context.read<LedgerStore>();
    final now = DateTime.now().millisecondsSinceEpoch;
    final cleaned = data.copyWith(items: data.filledItems);
    try {
      if (isInvoice) {
        final existing = widget.existingInvoice;
        final invoice = Invoice(
          id: existing?.id ?? newId(),
          number: cleaned.number,
          clientId: clientId,
          status: as ?? status,
          data: cleaned.copyWith(vendor: store.profile.isComplete ? store.profile.asParty : cleaned.vendor),
          category: category.isEmpty ? null : category,
          amountPaid: existing?.amountPaid ?? 0,
          paidAt: existing?.paidAt,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        );
        await store.saveInvoice(invoice, consumeNumber: existing == null);
        if (mounted) context.go('/invoices/${invoice.id}');
      } else {
        final existing = widget.existingReceipt;
        final receipt = Receipt(
          id: existing?.id ?? newId(),
          kind: ReceiptKind.generated,
          title: cleaned.vendor.name.trim(),
          date: cleaned.date,
          total: cleaned.totals.total,
          currency: cleaned.currency,
          category: category.isEmpty ? null : category,
          data: cleaned,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        );
        await store.saveReceipt(receipt, consumeNumber: existing == null);
        if (mounted) context.go('/receipts/${receipt.id}');
      }
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  bool storePartyNameEmpty() => data.customer.name.trim().isEmpty;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    final wide = MediaQuery.sizeOf(context).width >= 980;
    final title = editing
        ? (isInvoice ? 'Edit ${data.number}' : 'Edit ${data.number}')
        : (isInvoice ? 'New invoice' : 'Generate receipt');

    final form = ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SegmentedButton<int>(
          segments: const [
            ButtonSegment(value: 0, label: Text('1. Template'), icon: Icon(Icons.dashboard_customize_outlined)),
            ButtonSegment(value: 1, label: Text('2. Details'), icon: Icon(Icons.list_alt)),
          ],
          selected: {step},
          onSelectionChanged: (s) => setState(() => step = s.first),
        ),
        const SizedBox(height: 16),
        if (step == 0) ...[
          Text(isInvoice ? 'Choose an invoice template' : 'Choose a receipt template',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 4),
          const Text('You can change this later, even after saving.', style: TextStyle(color: RaseedColors.muted, fontSize: 13)),
          const SizedBox(height: 12),
          TemplateGrid(
            value: data.template,
            onChanged: (id) => setState(() => data = data.copyWith(template: id)),
          ),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerRight,
            child: FilledButton.icon(
              onPressed: () => setState(() => step = 1),
              icon: const Icon(Icons.arrow_forward),
              label: Text('Continue with ${templateMeta(data.template).name}'),
            ),
          ),
        ] else ...[
          _settingsCard(),
          const SizedBox(height: 12),
          if (isInvoice) _invoiceParties(store) else _receiptParties(),
          const SizedBox(height: 12),
          _itemsCard(),
          const SizedBox(height: 12),
          _totalsCard(),
        ],
        const SizedBox(height: 12),
        _saveBar(),
        const SizedBox(height: 80),
      ],
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          if (!wide)
            IconButton(
              tooltip: 'Preview',
              onPressed: () => setState(() => previewOpen = !previewOpen),
              icon: const Icon(Icons.visibility_outlined),
            ),
        ],
      ),
      body: wide
          ? Row(
              children: [
                Expanded(child: form),
                const VerticalDivider(width: 1),
                SizedBox(
                  width: 460,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: PdfPane(data: data, kind: widget.kind),
                  ),
                ),
              ],
            )
          : previewOpen
              ? Padding(padding: const EdgeInsets.all(16), child: PdfPane(data: data, kind: widget.kind))
              : form,
    );
  }

  Widget _settingsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(children: [
              Expanded(
                child: LabeledField(
                  label: isInvoice ? 'Invoice no.' : 'Receipt no.',
                  child: TextFormField(
                    key: ValueKey(data.number),
                    initialValue: data.number,
                    style: const TextStyle(fontFamily: 'monospace'),
                    onChanged: (v) => setState(() => data = data.copyWith(number: v)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: LabeledField(
                  label: isInvoice ? 'Issue date' : 'Date',
                  child: IsoDatePicker(value: data.date, onChanged: (v) => setState(() => data = data.copyWith(date: v))),
                ),
              ),
            ]),
            if (isInvoice) ...[
              const SizedBox(height: 12),
              LabeledField(
                label: 'Due date',
                child: IsoDatePicker(value: data.dueDate, onChanged: (v) => setState(() => data = data.copyWith(dueDate: v))),
              ),
            ],
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: LabeledField(
                  label: 'Language',
                  child: LanguagePicker(value: data.language, onChanged: (v) => setState(() => data = data.copyWith(language: v))),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: LabeledField(
                  label: 'Currency',
                  child: CurrencyPicker(value: data.currency, onChanged: (v) => setState(() => data = data.copyWith(currency: v))),
                ),
              ),
            ]),
            if (isInvoice) ...[
              const SizedBox(height: 12),
              LabeledField(
                label: 'Status',
                child: DropdownButtonFormField<InvoiceStatus>(
                  // ignore: deprecated_member_use
                  value: status,
                  items: [
                    for (final s in InvoiceStatus.values)
                      if (s != InvoiceStatus.overdue)
                        DropdownMenuItem(value: s, child: Text(s.name[0].toUpperCase() + s.name.substring(1))),
                  ],
                  onChanged: (v) { if (v != null) setState(() => status = v); },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _invoiceParties(LedgerStore store) {
    return Column(
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Client', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  // ignore: deprecated_member_use
                  value: store.clients.any((c) => c.id == clientId) ? clientId : null,
                  hint: const Text('Select a saved client or enter details below'),
                  items: [
                    for (final c in store.clients) DropdownMenuItem(value: c.id, child: Text(c.name)),
                  ],
                  onChanged: (id) {
                    final client = store.clientById(id);
                    setState(() {
                      clientId = id;
                      if (client != null) data = data.copyWith(customer: client.asParty);
                    });
                  },
                ),
                const SizedBox(height: 12),
                PartyFields(
                  key: ValueKey(clientId ?? data.customer.name),
                  party: data.customer,
                  requiredName: true,
                  nameHint: 'Client / company name',
                  onChanged: (p) => setState(() => data = data.copyWith(customer: p)),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('From (your business)', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                if (store.profile.isComplete)
                  Text('${store.profile.name}\n${store.profile.address}', style: const TextStyle(color: RaseedColors.muted))
                else
                  PartyFields(
                    party: data.vendor,
                    requiredName: true,
                    nameHint: 'Your business name',
                    onChanged: (p) => setState(() => data = data.copyWith(vendor: p)),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _receiptParties() {
    return Column(
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Vendor / service provider', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                PartyFields(
                  party: data.vendor,
                  requiredName: true,
                  nameHint: 'e.g. Al-Madina General Store',
                  onChanged: (p) => setState(() => data = data.copyWith(vendor: p)),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Customer (paid by)', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                PartyFields(
                  party: data.customer,
                  nameHint: 'Your name',
                  onChanged: (p) => setState(() => data = data.copyWith(customer: p)),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _itemsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Items', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            LineItemsEditor(
              items: data.items,
              currency: data.currency,
              onChanged: (items) => setState(() => data = data.copyWith(items: items)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _totalsCard() {
    final totals = data.totals;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(children: [
              Expanded(
                child: LabeledField(
                  label: 'Tax %',
                  child: TextFormField(
                    initialValue: data.taxPercent == 0 ? '' : data.taxPercent.toString(),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    onChanged: (v) => setState(() => data = data.copyWith(taxPercent: double.tryParse(v) ?? 0)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: LabeledField(
                  label: 'Discount',
                  child: TextFormField(
                    initialValue: data.discountValue == 0 ? '' : data.discountValue.toString(),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      suffixText: data.discountType == DiscountType.percent ? '%' : data.currency.code,
                    ),
                    onChanged: (v) => setState(() => data = data.copyWith(discountValue: double.tryParse(v) ?? 0)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: LabeledField(
                  label: 'Type',
                  child: DropdownButtonFormField<DiscountType>(
                    // ignore: deprecated_member_use
                    value: data.discountType,
                    items: [
                      DropdownMenuItem(value: DiscountType.amount, child: Text(data.currency.code)),
                      const DropdownMenuItem(value: DiscountType.percent, child: Text('%')),
                    ],
                    onChanged: (v) { if (v != null) setState(() => data = data.copyWith(discountType: v)); },
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: LabeledField(
                  label: 'Payment method',
                  child: PaymentPicker(value: data.paymentMethod, onChanged: (v) => setState(() => data = data.copyWith(paymentMethod: v))),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: LabeledField(
                  label: 'Category',
                  child: CategoryPicker(
                    value: category,
                    options: isInvoice ? invoiceCategories : expenseCategories,
                    onChanged: (v) => setState(() => category = v),
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            LabeledField(
              label: 'Notes',
              child: TextFormField(
                initialValue: data.notes,
                minLines: 2,
                maxLines: 4,
                decoration: const InputDecoration(hintText: 'Payment terms, warranty, reference…'),
                onChanged: (v) => setState(() => data = data.copyWith(notes: v)),
              ),
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: Text(formatMoney(totals.total, data.currency, data.language),
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _saveBar() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (error != null) Text(error!, style: const TextStyle(color: Color(0xFFB91C1C))),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.end,
              children: [
                if (isInvoice && !editing)
                  OutlinedButton(
                    onPressed: saving ? null : () => _save(as: InvoiceStatus.draft),
                    child: const Text('Save draft'),
                  ),
                FilledButton.icon(
                  onPressed: saving ? null : () => _save(as: isInvoice ? (editing ? status : InvoiceStatus.sent) : null),
                  icon: saving
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.save_outlined),
                  label: Text(editing ? 'Save changes' : (isInvoice ? 'Save invoice' : 'Save receipt')),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
