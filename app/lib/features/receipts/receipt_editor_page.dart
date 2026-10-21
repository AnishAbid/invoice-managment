import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models.dart';
import '../../data/store.dart';
import '../documents/document_editor.dart';

class ReceiptEditorPage extends StatelessWidget {
  const ReceiptEditorPage({super.key, this.id});

  final String? id;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    final existing = id == null ? null : store.receiptById(id!);
    if (id != null && (existing == null || existing.kind != ReceiptKind.generated)) {
      return const Scaffold(body: Center(child: Text('This receipt cannot be edited')));
    }
    return DocumentEditorPage(kind: DocKind.receipt, existingReceipt: existing);
  }
}
