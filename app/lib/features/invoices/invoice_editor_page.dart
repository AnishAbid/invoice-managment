import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models.dart';
import '../../data/store.dart';
import '../documents/document_editor.dart';

class InvoiceEditorPage extends StatelessWidget {
  const InvoiceEditorPage({super.key, this.id});

  final String? id;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    final existing = id == null ? null : store.invoiceById(id!);
    if (id != null && existing == null) {
      return const Scaffold(body: Center(child: Text('Invoice not found')));
    }
    return DocumentEditorPage(kind: DocKind.invoice, existingInvoice: existing);
  }
}
