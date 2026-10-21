import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:printing/printing.dart';
import 'package:provider/provider.dart';

import '../../core/money.dart';
import '../../data/models.dart';
import '../../data/store.dart';
import '../../pdf/document_pdf.dart';
import '../../widgets/common.dart';
import '../../widgets/pdf_pane.dart';

class ReceiptDetailPage extends StatelessWidget {
  const ReceiptDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    final receipt = store.receiptById(id);
    if (receipt == null) {
      return Scaffold(appBar: AppBar(), body: const Center(child: Text('Receipt not found')));
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(receipt.title),
        actions: [
          if (receipt.kind == ReceiptKind.generated)
            IconButton(onPressed: () => context.go('/receipts/$id/edit'), icon: const Icon(Icons.edit_outlined)),
          IconButton(
            onPressed: () async {
              if (!await confirmDelete(context, 'receipt')) return;
              await store.deleteReceipt(id);
              if (context.mounted) context.go('/receipts');
            },
            icon: const Icon(Icons.delete_outline),
          ),
        ],
      ),
      body: receipt.kind == ReceiptKind.generated && receipt.data != null
          ? Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${receipt.data!.number} · ${formatDate(receipt.date)} · ${formatMoney(receipt.total, receipt.currency)}'),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        children: [
                          FilledButton.icon(
                            onPressed: () => shareDocument(receipt.data!, DocKind.receipt),
                            icon: const Icon(Icons.ios_share),
                            label: const Text('Share PDF'),
                          ),
                          OutlinedButton.icon(
                            onPressed: () => printDocument(receipt.data!, DocKind.receipt),
                            icon: const Icon(Icons.print_outlined),
                            label: const Text('Print'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                Expanded(child: PdfPane(data: receipt.data!, kind: DocKind.receipt, useSampleIfEmpty: false)),
              ],
            )
          : FutureBuilder<StoredFile?>(
              future: store.getFile(id),
              builder: (context, snap) {
                final file = snap.data;
                return ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text(formatDate(receipt.date)),
                    if (receipt.total > 0) Text(formatMoney(receipt.total, receipt.currency), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                    if (receipt.notes != null && receipt.notes!.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Card(child: Padding(padding: const EdgeInsets.all(16), child: Text(receipt.notes!))),
                    ],
                    const SizedBox(height: 12),
                    if (file != null) ...[
                      Align(
                        alignment: Alignment.centerLeft,
                        child: FilledButton.icon(
                          onPressed: () => Printing.sharePdf(
                            bytes: Uint8List.fromList(file.bytes),
                            filename: file.name,
                          ),
                          icon: const Icon(Icons.download_outlined),
                          label: const Text('Download'),
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (file.mime.contains('pdf'))
                        SizedBox(
                          height: 520,
                          child: PdfPreview(
                            build: (_) async => Uint8List.fromList(file.bytes),
                            canChangePageFormat: false,
                            canDebug: false,
                          ),
                        )
                      else
                        Image.memory(Uint8List.fromList(file.bytes)),
                    ] else if (snap.connectionState != ConnectionState.done)
                      const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
                    else
                      const Text('File missing'),
                  ],
                );
              },
            ),
    );
  }
}
