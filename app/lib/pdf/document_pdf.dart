import 'package:flutter/foundation.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../core/constants.dart';
import '../core/i18n.dart';
import '../core/money.dart';
import '../data/models.dart';

class PdfFonts {
  static pw.Font? sans;
  static pw.Font? sansBold;
  static pw.Font? serif;
  static pw.Font? urdu;
  static pw.Font? mono;

  static Future<void> ensure() async {
    if (sans != null) return;
    try {
      sans = await PdfGoogleFonts.interRegular();
      sansBold = await PdfGoogleFonts.interBold();
      serif = await PdfGoogleFonts.libreBaskervilleRegular();
      mono = await PdfGoogleFonts.robotoMonoRegular();
      urdu = await PdfGoogleFonts.notoNastaliqUrduRegular();
    } catch (_) {
      // Built-in Helvetica is used when a downloadable font is unavailable.
    }
  }
}

String safeFilename(String raw) =>
    raw.replaceAll(RegExp(r'[^\w\u0600-\u06FF-]+'), '_');

Future<Uint8List> buildDocumentPdf(DocumentData data, DocKind kind) async {
  await PdfFonts.ensure();
  final meta = templateMeta(data.template);
  final doc = pw.Document();
  final pageFormat = meta.paper == PaperSize.thermal
      ? const PdfPageFormat(80 * PdfPageFormat.mm, double.infinity, marginAll: 6 * PdfPageFormat.mm)
      : PdfPageFormat.a4;

  doc.addPage(
    pw.Page(
      pageFormat: pageFormat,
      margin: meta.paper == PaperSize.thermal
          ? const pw.EdgeInsets.all(8)
          : const pw.EdgeInsets.all(28),
      build: (context) => _sheet(data, kind),
    ),
  );
  return doc.save();
}

Future<void> shareDocument(DocumentData data, DocKind kind) async {
  final bytes = await buildDocumentPdf(data, kind);
  final name = safeFilename('${data.number}-${data.vendor.name.isEmpty ? data.customer.name : data.vendor.name}.pdf');
  await Printing.sharePdf(bytes: bytes, filename: name);
}

Future<void> printDocument(DocumentData data, DocKind kind) async {
  await Printing.layoutPdf(onLayout: (_) => buildDocumentPdf(data, kind));
}

pw.Widget _sheet(DocumentData data, DocKind kind) {
  return switch (data.template) {
    TemplateId.modern => _modern(data, kind),
    TemplateId.bold => _bold(data, kind),
    TemplateId.elegant => _elegant(data, kind),
    TemplateId.memo => _memo(data, kind),
    TemplateId.thermal => _thermal(data, kind),
    TemplateId.classic => _classic(data, kind),
  };
}

class _Ctx {
  _Ctx(this.data, this.kind)
      : L = data.language,
        totals = data.totals,
        items = data.filledItems,
        rtl = data.language == Language.ur;

  final DocumentData data;
  final DocKind kind;
  final Language L;
  final Totals totals;
  final List<LineItem> items;
  final bool rtl;

  String t(String key) => tr(L, key);
  String money(double n) => formatMoney(n, data.currency, L);
  String get date => formatDate(data.date, L);
  String get title => kind == DocKind.invoice ? t('invoice') : t('receipt');
  String get numberLabel => kind == DocKind.invoice ? t('invoiceNo') : t('receiptNo');
  String get billedLabel => kind == DocKind.invoice ? t('billedTo') : t('receivedFrom');
  pw.TextDirection get dir => rtl ? pw.TextDirection.rtl : pw.TextDirection.ltr;
  pw.Font? get baseFont => rtl ? PdfFonts.urdu : PdfFonts.sans;
  pw.Font? get boldFont => rtl ? PdfFonts.urdu : PdfFonts.sansBold;
  pw.TextStyle text({double size = 10, PdfColor? color, bool bold = false, pw.Font? font}) =>
      pw.TextStyle(
        font: font ?? (bold ? boldFont : baseFont),
        fontFallback: [if (PdfFonts.urdu != null) PdfFonts.urdu!],
        fontSize: size,
        color: color ?? PdfColor.fromInt(0xFF0F172A),
        fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal,
      );
}

pw.Widget _wrap(_Ctx c, pw.Widget child) {
  return pw.Directionality(textDirection: c.dir, child: child);
}

pw.Widget _classic(DocumentData data, DocKind kind) {
  final c = _Ctx(data, kind);
  final green = PdfColor.fromInt(0xFF047857);
  return _wrap(
    c,
    pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.stretch,
      children: [
        pw.Container(
          padding: const pw.EdgeInsets.only(bottom: 12),
          decoration: pw.BoxDecoration(border: pw.Border(bottom: pw.BorderSide(color: green, width: 2))),
          child: pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Expanded(child: _partyBlock(c, data.vendor.name, data.vendor, heading: false, nameSize: 16)),
              pw.Column(
                crossAxisAlignment: c.rtl ? pw.CrossAxisAlignment.start : pw.CrossAxisAlignment.end,
                children: [
                  pw.Text(c.title, style: c.text(size: 20, color: green, bold: true)),
                  pw.SizedBox(height: 8),
                  pw.Text('${c.numberLabel}: ${data.number}', style: c.text(size: 10, color: PdfColor.fromInt(0xFF475569))),
                  pw.Text('${c.t('date')}: ${c.date}', style: c.text(size: 10, color: PdfColor.fromInt(0xFF475569))),
                  if (kind == DocKind.invoice && data.dueDate.isNotEmpty)
                    pw.Text('${c.t('dueDate')}: ${formatDate(data.dueDate, c.L)}',
                        style: c.text(size: 10, color: PdfColor.fromInt(0xFF475569))),
                ],
              ),
            ],
          ),
        ),
        pw.SizedBox(height: 16),
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Expanded(child: _labeledParty(c, c.billedLabel, data.customer)),
            pw.Column(
              crossAxisAlignment: c.rtl ? pw.CrossAxisAlignment.start : pw.CrossAxisAlignment.end,
              children: [
                pw.Text(c.t('paymentMethod'), style: c.text(size: 9, color: PdfColor.fromInt(0xFF64748B), bold: true)),
                pw.SizedBox(height: 4),
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromInt(0xFFECFDF5),
                    borderRadius: pw.BorderRadius.circular(12),
                  ),
                  child: pw.Text(c.t(data.paymentMethod.key), style: c.text(size: 10, color: green, bold: true)),
                ),
              ],
            ),
          ],
        ),
        pw.SizedBox(height: 16),
        _itemsTable(c, headerColor: PdfColor.fromInt(0xFFF1F5F9), headerText: PdfColor.fromInt(0xFF475569)),
        pw.SizedBox(height: 12),
        _totals(c, accent: green, onAccent: PdfColors.white),
        if (data.notes.trim().isNotEmpty) ...[
          pw.SizedBox(height: 16),
          pw.Container(
            padding: const pw.EdgeInsets.all(10),
            decoration: pw.BoxDecoration(
              color: PdfColor.fromInt(0xFFF8FAFC),
              border: pw.Border.all(color: PdfColor.fromInt(0xFFE2E8F0)),
              borderRadius: pw.BorderRadius.circular(8),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(c.t('notes'), style: c.text(size: 9, color: PdfColor.fromInt(0xFF64748B), bold: true)),
                pw.Text(data.notes, style: c.text()),
              ],
            ),
          ),
        ],
        pw.Spacer(),
        _footer(c),
      ],
    ),
  );
}

pw.Widget _modern(DocumentData data, DocKind kind) {
  final c = _Ctx(data, kind);
  final indigo = PdfColor.fromInt(0xFF4F46E5);
  return _wrap(
    c,
    pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.stretch,
      children: [
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Expanded(
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(c.title, style: c.text(size: 9, color: PdfColor.fromInt(0xFF6B7280), bold: true)),
                  pw.Text(data.vendor.name.isEmpty ? '—' : data.vendor.name, style: c.text(size: 20, bold: true)),
                ],
              ),
            ),
            pw.Text('#${data.number}', style: c.text(size: 10, color: PdfColor.fromInt(0xFF6B7280), font: PdfFonts.mono)),
          ],
        ),
        pw.SizedBox(height: 18),
        pw.Container(
          padding: const pw.EdgeInsets.symmetric(vertical: 12),
          decoration: const pw.BoxDecoration(
            border: pw.Border(
              top: pw.BorderSide(color: PdfColor.fromInt(0xFFE5E7EB)),
              bottom: pw.BorderSide(color: PdfColor.fromInt(0xFFE5E7EB)),
            ),
          ),
          child: pw.Row(
            children: [
              _stat(c, kind == DocKind.invoice ? c.t('total') : c.t('amountPaid'), c.money(c.totals.total), valueColor: indigo),
              _stat(c, c.t('date'), c.date),
              _stat(c, c.t('paymentMethod'), c.t(data.paymentMethod.key)),
            ],
          ),
        ),
        pw.SizedBox(height: 16),
        pw.Row(children: [
          pw.Expanded(child: _labeledParty(c, c.t('from'), data.vendor)),
          pw.Expanded(child: _labeledParty(c, c.billedLabel, data.customer)),
        ]),
        pw.SizedBox(height: 18),
        pw.Text(c.t('summary'), style: c.text(size: 9, color: PdfColor.fromInt(0xFF6B7280), bold: true)),
        pw.SizedBox(height: 6),
        pw.Container(
          padding: const pw.EdgeInsets.all(12),
          decoration: pw.BoxDecoration(color: PdfColor.fromInt(0xFFF9FAFB), borderRadius: pw.BorderRadius.circular(12)),
          child: pw.Column(
            children: [
              ...c.items.map(
                (item) => pw.Padding(
                  padding: const pw.EdgeInsets.symmetric(vertical: 6),
                  child: pw.Row(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Expanded(
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text(item.description, style: c.text()),
                            pw.Text('${item.quantity} × ${c.money(item.unitPrice)}',
                                style: c.text(size: 9, color: PdfColor.fromInt(0xFF6B7280))),
                          ],
                        ),
                      ),
                      pw.Text(c.money(item.lineTotal), style: c.text(bold: true)),
                    ],
                  ),
                ),
              ),
              _totals(c, boxed: false),
            ],
          ),
        ),
        if (data.notes.trim().isNotEmpty) ...[
          pw.SizedBox(height: 14),
          pw.Text(c.t('notes'), style: c.text(size: 9, color: PdfColor.fromInt(0xFF6B7280), bold: true)),
          pw.Text(data.notes, style: c.text()),
        ],
        pw.Spacer(),
        _footer(c),
      ],
    ),
  );
}

pw.Widget _bold(DocumentData data, DocKind kind) {
  final c = _Ctx(data, kind);
  final ink = PdfColor.fromInt(0xFF0F172A);
  final amber = PdfColor.fromInt(0xFFF59E0B);
  return _wrap(
    c,
    pw.Column(
      children: [
        pw.Container(
          color: ink,
          padding: const pw.EdgeInsets.all(18),
          child: pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Container(
                width: 36,
                height: 36,
                alignment: pw.Alignment.center,
                decoration: pw.BoxDecoration(color: amber, borderRadius: pw.BorderRadius.circular(6)),
                child: pw.Text(initials(data.vendor.name), style: c.text(size: 12, color: ink, bold: true)),
              ),
              pw.SizedBox(width: 10),
              pw.Expanded(
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(data.vendor.name.isEmpty ? '—' : data.vendor.name, style: c.text(size: 14, color: PdfColors.white, bold: true)),
                    if (data.vendor.address.isNotEmpty)
                      pw.Text(data.vendor.address, style: c.text(size: 9, color: PdfColor.fromInt(0xFFCBD5E1))),
                    if (data.vendor.phone.isNotEmpty)
                      pw.Text('${c.t('phone')}: ${data.vendor.phone}', style: c.text(size: 9, color: PdfColor.fromInt(0xFFCBD5E1))),
                  ],
                ),
              ),
              pw.Column(
                crossAxisAlignment: c.rtl ? pw.CrossAxisAlignment.start : pw.CrossAxisAlignment.end,
                children: [
                  pw.Text(c.title, style: c.text(size: 18, color: amber, bold: true)),
                  pw.Text('# ${data.number}', style: c.text(size: 10, color: PdfColors.white)),
                  pw.Text(c.date, style: c.text(size: 9, color: PdfColor.fromInt(0xFFCBD5E1))),
                ],
              ),
            ],
          ),
        ),
        pw.Container(height: 4, color: amber),
        pw.SizedBox(height: 16),
        pw.Row(children: [
          pw.Expanded(child: _labeledParty(c, c.billedLabel, data.customer, accent: PdfColor.fromInt(0xFFB45309))),
          pw.Text(c.t(data.paymentMethod.key), style: c.text(bold: true)),
        ]),
        pw.SizedBox(height: 12),
        _itemsTable(c, headerColor: ink, headerText: PdfColors.white),
        pw.SizedBox(height: 12),
        _totals(c, accent: amber, onAccent: ink),
        if (data.notes.trim().isNotEmpty) ...[
          pw.SizedBox(height: 12),
          pw.Text(c.t('notes'), style: c.text(size: 9, color: PdfColor.fromInt(0xFFB45309), bold: true)),
          pw.Text(data.notes, style: c.text()),
        ],
        pw.Spacer(),
        _footer(c),
      ],
    ),
  );
}

pw.Widget _elegant(DocumentData data, DocKind kind) {
  final c = _Ctx(data, kind);
  final gold = PdfColor.fromInt(0xFFA8865A);
  final cream = PdfColor.fromInt(0xFFFDFBF6);
  return _wrap(
    c,
    pw.Container(
      color: cream,
      padding: const pw.EdgeInsets.all(8),
      child: pw.Container(
        padding: const pw.EdgeInsets.all(22),
        decoration: pw.BoxDecoration(border: pw.Border.all(color: gold, width: 2)),
        child: pw.Column(
          children: [
            pw.Text(data.vendor.name.isEmpty ? '—' : data.vendor.name,
                style: c.text(size: 18, bold: true, font: c.rtl ? PdfFonts.urdu : PdfFonts.serif),
                textAlign: pw.TextAlign.center),
            if (data.vendor.address.isNotEmpty)
              pw.Text(data.vendor.address, style: c.text(size: 10, color: PdfColor.fromInt(0xFF57534E)), textAlign: pw.TextAlign.center),
            pw.SizedBox(height: 8),
            pw.Text(kind == DocKind.invoice ? c.t('invoice') : c.t('paymentReceipt'),
                style: c.text(size: 13, color: PdfColor.fromInt(0xFF78350F))),
            pw.SizedBox(height: 14),
            pw.Row(children: [
              _stat(c, c.numberLabel, data.number),
              _stat(c, c.t('date'), c.date),
              _stat(c, c.t('paymentMethod'), c.t(data.paymentMethod.key)),
            ]),
            pw.SizedBox(height: 14),
            _labeledParty(c, c.billedLabel, data.customer, accent: gold),
            pw.SizedBox(height: 12),
            _itemsTable(c, headerColor: cream, headerText: PdfColor.fromInt(0xFF78350F), rule: gold),
            pw.SizedBox(height: 12),
            pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.center,
              children: [
                pw.Expanded(
                  child: pw.Center(
                    child: pw.Transform.rotate(
                      angle: -0.2,
                      child: pw.Container(
                        padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                        decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColor.fromInt(0xFFB91C1C), width: 2)),
                        child: pw.Text(c.t('paid'), style: c.text(size: 16, color: PdfColor.fromInt(0xFFB91C1C), bold: true)),
                      ),
                    ),
                  ),
                ),
                pw.SizedBox(width: 180, child: _totals(c, boxed: false, goldRule: true)),
              ],
            ),
            pw.Spacer(),
            _footer(c),
          ],
        ),
      ),
    ),
  );
}

pw.Widget _memo(DocumentData data, DocKind kind) {
  final c = _Ctx(data, kind);
  final navy = PdfColor.fromInt(0xFF1E3A8A);
  return _wrap(
    c,
    pw.Container(
      padding: const pw.EdgeInsets.all(14),
      decoration: pw.BoxDecoration(border: pw.Border.all(color: navy, width: 2)),
      child: pw.Column(
        children: [
          pw.Text(data.vendor.name.isEmpty ? '—' : data.vendor.name.toUpperCase(),
              style: c.text(size: 18, color: navy, bold: true), textAlign: pw.TextAlign.center),
          if (data.vendor.address.isNotEmpty)
            pw.Text(data.vendor.address, style: c.text(size: 10, color: navy), textAlign: pw.TextAlign.center),
          pw.SizedBox(height: 8),
          pw.Container(
            padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 3),
            decoration: pw.BoxDecoration(color: navy, borderRadius: pw.BorderRadius.circular(12)),
            child: pw.Text(kind == DocKind.invoice ? c.t('invoice') : c.t('cashMemo'),
                style: c.text(size: 10, color: PdfColors.white, bold: true)),
          ),
          pw.SizedBox(height: 12),
          pw.Row(children: [
            pw.Expanded(child: pw.Text('${c.numberLabel}: ${data.number}', style: c.text(color: navy, bold: true))),
            pw.Text('${c.t('date')}: ${c.date}', style: c.text(color: navy, bold: true)),
          ]),
          pw.SizedBox(height: 6),
          pw.Text('${c.t('ms')} ${data.customer.name}', style: c.text(color: navy)),
          pw.SizedBox(height: 10),
          _itemsTable(c, headerColor: PdfColor.fromInt(0xFFDBEAFE), headerText: navy, rule: navy, numbered: true),
          pw.SizedBox(height: 10),
          _totals(c, accent: navy, onAccent: PdfColors.white),
          if (!c.rtl) ...[
            pw.SizedBox(height: 8),
            pw.Text('${c.t('inWords')}: ${amountInWords(c.totals.total, data.currency)}',
                style: c.text(size: 9, color: navy)),
          ],
          pw.Spacer(),
          _footer(c, color: navy),
        ],
      ),
    ),
  );
}

pw.Widget _thermal(DocumentData data, DocKind kind) {
  final c = _Ctx(data, kind);
  final rule = pw.Divider(color: PdfColor.fromInt(0xFF334155), borderStyle: pw.BorderStyle.dashed);
  return _wrap(
    c,
    pw.Column(
      children: [
        pw.Text(data.vendor.name.isEmpty ? '—' : data.vendor.name.toUpperCase(),
            style: c.text(size: 12, bold: true, font: c.rtl ? PdfFonts.urdu : PdfFonts.mono),
            textAlign: pw.TextAlign.center),
        if (data.vendor.address.isNotEmpty)
          pw.Text(data.vendor.address, style: c.text(size: 8, font: PdfFonts.mono), textAlign: pw.TextAlign.center),
        if (data.vendor.phone.isNotEmpty)
          pw.Text('${c.t('phone')}: ${data.vendor.phone}', style: c.text(size: 8, font: PdfFonts.mono), textAlign: pw.TextAlign.center),
        rule,
        pw.Text(c.title.toUpperCase(), style: c.text(size: 10, bold: true, font: PdfFonts.mono), textAlign: pw.TextAlign.center),
        rule,
        _kv(c, c.numberLabel, data.number),
        _kv(c, c.t('date'), c.date),
        if (data.customer.name.isNotEmpty) _kv(c, c.billedLabel, data.customer.name),
        rule,
        ...c.items.map(
          (item) => pw.Padding(
            padding: const pw.EdgeInsets.only(bottom: 4),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(item.description, style: c.text(size: 9, font: PdfFonts.mono)),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('${item.quantity} x ${c.money(item.unitPrice)}', style: c.text(size: 8, font: PdfFonts.mono)),
                    pw.Text(c.money(item.lineTotal), style: c.text(size: 9, bold: true, font: PdfFonts.mono)),
                  ],
                ),
              ],
            ),
          ),
        ),
        rule,
        _kv(c, c.t('subtotal'), c.money(c.totals.subtotal)),
        if (c.totals.discount > 0) _kv(c, discountLabel(data, c.t), '− ${c.money(c.totals.discount)}'),
        if (c.totals.tax > 0) _kv(c, '${c.t('tax')} (${data.taxPercent}%)', c.money(c.totals.tax)),
        pw.Divider(color: PdfColor.fromInt(0xFF111827), thickness: 1.4),
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(c.t('total').toUpperCase(), style: c.text(size: 12, bold: true, font: PdfFonts.mono)),
            pw.Text(c.money(c.totals.total), style: c.text(size: 12, bold: true, font: PdfFonts.mono)),
          ],
        ),
        pw.Divider(color: PdfColor.fromInt(0xFF111827), thickness: 1.4),
        _kv(c, c.t('paymentMethod'), c.t(data.paymentMethod.key)),
        if (data.notes.trim().isNotEmpty) ...[rule, pw.Text(data.notes, style: c.text(size: 8, font: PdfFonts.mono))],
        rule,
        pw.Text('*** ${c.t('thankYou').toUpperCase()} ***', style: c.text(size: 8, bold: true, font: PdfFonts.mono), textAlign: pw.TextAlign.center),
        pw.SizedBox(height: 6),
        pw.Text(c.t('selfGenerated'), style: c.text(size: 7, color: PdfColor.fromInt(0xFF6B7280)), textAlign: pw.TextAlign.center),
      ],
    ),
  );
}

pw.Widget _itemsTable(
  _Ctx c, {
  required PdfColor headerColor,
  required PdfColor headerText,
  PdfColor? rule,
  bool numbered = false,
}) {
  final headers = [
    if (numbered) c.t('sNo'),
    c.t('description'),
    c.t('qty'),
    c.t('rate'),
    c.t('amount'),
  ];
  return pw.TableHelper.fromTextArray(
    headerDecoration: pw.BoxDecoration(color: headerColor),
    headerStyle: c.text(size: 9, color: headerText, bold: true),
    cellStyle: c.text(size: 9),
    headerAlignment: pw.Alignment.centerLeft,
    cellAlignments: {
      headers.length - 3: pw.Alignment.center,
      headers.length - 2: pw.Alignment.centerRight,
      headers.length - 1: pw.Alignment.centerRight,
    },
    border: rule == null ? pw.TableBorder(bottom: const pw.BorderSide(color: PdfColor.fromInt(0xFFE2E8F0))) : pw.TableBorder.all(color: rule),
    headers: headers,
    data: [
      if (c.items.isEmpty) List.filled(headers.length, '—'),
      ...c.items.asMap().entries.map((e) {
        final item = e.value;
        return [
          if (numbered) '${e.key + 1}',
          item.description,
          '${item.quantity}',
          c.money(item.unitPrice),
          c.money(item.lineTotal),
        ];
      }),
    ],
  );
}

pw.Widget _totals(_Ctx c, {PdfColor? accent, PdfColor? onAccent, bool boxed = true, bool goldRule = false}) {
  final rows = <(String, String)>[
    (c.t('subtotal'), c.money(c.totals.subtotal)),
    if (c.totals.discount > 0) (discountLabel(c.data, c.t), '− ${c.money(c.totals.discount)}'),
    if (c.totals.tax > 0) ('${c.t('tax')} (${c.data.taxPercent}%)', c.money(c.totals.tax)),
  ];
  return pw.Align(
    alignment: c.rtl ? pw.Alignment.centerLeft : pw.Alignment.centerRight,
    child: pw.SizedBox(
      width: 180,
      child: pw.Column(
        children: [
          ...rows.map(
            (r) => pw.Padding(
              padding: const pw.EdgeInsets.symmetric(vertical: 2, horizontal: 6),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(r.$1, style: c.text(size: 9, color: PdfColor.fromInt(0xFF475569))),
                  pw.Text(r.$2, style: c.text(size: 9, bold: true)),
                ],
              ),
            ),
          ),
          pw.SizedBox(height: 4),
          pw.Container(
            padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            decoration: boxed
                ? pw.BoxDecoration(color: accent ?? PdfColor.fromInt(0xFF047857), borderRadius: pw.BorderRadius.circular(6))
                : goldRule
                    ? const pw.BoxDecoration(
                        border: pw.Border(
                          top: pw.BorderSide(color: PdfColor.fromInt(0xFFA8865A), width: 1.2),
                          bottom: pw.BorderSide(color: PdfColor.fromInt(0xFFA8865A), width: 1.2),
                        ),
                      )
                    : const pw.BoxDecoration(border: pw.Border(top: pw.BorderSide(color: PdfColor.fromInt(0xFFE5E7EB)))),
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text(c.t('total'), style: c.text(size: 11, bold: true, color: boxed ? (onAccent ?? PdfColors.white) : null)),
                pw.Text(c.money(c.totals.total), style: c.text(size: 11, bold: true, color: boxed ? (onAccent ?? PdfColors.white) : null)),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

pw.Widget _labeledParty(_Ctx c, String label, Party party, {PdfColor? accent, bool heading = true, double nameSize = 11}) {
  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      if (heading) pw.Text(label, style: c.text(size: 9, color: accent ?? PdfColor.fromInt(0xFF64748B), bold: true)),
      pw.Text(party.name.isEmpty ? '—' : party.name, style: c.text(size: nameSize, bold: true)),
      if (party.address.isNotEmpty) pw.Text(party.address, style: c.text(size: 9, color: PdfColor.fromInt(0xFF475569))),
      if (party.phone.isNotEmpty) pw.Text('${c.t('phone')}: ${party.phone}', style: c.text(size: 9, color: PdfColor.fromInt(0xFF475569))),
      if (party.email.isNotEmpty) pw.Text(party.email, style: c.text(size: 9, color: PdfColor.fromInt(0xFF475569))),
    ],
  );
}

pw.Widget _partyBlock(_Ctx c, String name, Party party, {required bool heading, required double nameSize}) {
  return _labeledParty(c, name, party, heading: heading, nameSize: nameSize);
}

pw.Widget _stat(_Ctx c, String label, String value, {PdfColor? valueColor}) {
  return pw.Expanded(
    child: pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(label, style: c.text(size: 8, color: PdfColor.fromInt(0xFF6B7280), bold: true)),
        pw.Text(value, style: c.text(size: 11, color: valueColor, bold: true)),
      ],
    ),
  );
}

pw.Widget _kv(_Ctx c, String k, String v) {
  return pw.Row(
    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
    children: [
      pw.Text(k, style: c.text(size: 8, color: PdfColor.fromInt(0xFF374151), font: PdfFonts.mono)),
      pw.Text(v, style: c.text(size: 8, bold: true, font: PdfFonts.mono)),
    ],
  );
}

pw.Widget _footer(_Ctx c, {PdfColor? color}) {
  return pw.Column(
    children: [
      pw.SizedBox(height: 18),
      pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(c.t('thankYou'), style: c.text(size: 10, color: color ?? PdfColor.fromInt(0xFF475569))),
          pw.Container(
            width: 120,
            padding: const pw.EdgeInsets.only(top: 4),
            decoration: pw.BoxDecoration(border: pw.Border(top: pw.BorderSide(color: color ?? PdfColor.fromInt(0xFF94A3B8)))),
            child: pw.Text(c.t('signature'), style: c.text(size: 8, color: PdfColor.fromInt(0xFF64748B)), textAlign: pw.TextAlign.center),
          ),
        ],
      ),
      pw.SizedBox(height: 10),
      pw.Text(c.t('selfGenerated'), style: c.text(size: 7, color: PdfColor.fromInt(0xFF94A3B8)), textAlign: pw.TextAlign.center),
    ],
  );
}
