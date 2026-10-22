import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/money.dart';
import '../../data/models.dart';
import '../../data/store.dart';
import '../../pdf/document_pdf.dart';
import '../../widgets/common.dart';
import '../../widgets/pdf_pane.dart';

class InvoiceDetailPage extends StatelessWidget {
  const InvoiceDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    final invoice = store.invoiceById(id);
    if (invoice == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Invoice not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(invoice.number),
        actions: [
          IconButton(
            tooltip: 'Edit',
            onPressed: invoice.status == InvoiceStatus.cancelled ? null : () => context.go('/invoices/$id/edit'),
            icon: const Icon(Icons.edit_outlined),
          ),
          IconButton(
            tooltip: 'Delete',
            onPressed: () async {
              if (!await confirmDelete(context, 'invoice')) return;
              await store.deleteInvoice(id);
              if (context.mounted) context.go('/invoices');
            },
            icon: const Icon(Icons.delete_outline),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(invoice.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text('${formatShortDate(invoice.date)} · ${formatMoney(invoice.total, invoice.currency)}'),
                const SizedBox(height: 8),
                StatusChip(status: invoice.effectiveStatus),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilledButton.icon(
                      onPressed: () => shareDocument(invoice.data, DocKind.invoice),
                      icon: const Icon(Icons.ios_share),
                      label: const Text('Share PDF'),
                    ),
                    OutlinedButton.icon(
                      onPressed: () => printDocument(invoice.data, DocKind.invoice),
                      icon: const Icon(Icons.print_outlined),
                      label: const Text('Print'),
                    ),
                    if (invoice.status != InvoiceStatus.paid && invoice.status != InvoiceStatus.cancelled)
                      FilledButton.icon(
                        onPressed: () async {
                          final receipt = await store.markInvoicePaid(invoice);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Marked paid. Receipt ${receipt.data?.number ?? ''} created.')),
                            );
                            context.go('/receipts/${receipt.id}');
                          }
                        },
                        icon: const Icon(Icons.check_circle_outline),
                        label: const Text('Mark paid'),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(child: PdfPane(data: invoice.data, kind: DocKind.invoice, useSampleIfEmpty: false)),
        ],
      ),
    );
  }
}
