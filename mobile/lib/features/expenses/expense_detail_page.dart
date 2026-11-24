import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:printing/printing.dart';
import 'package:provider/provider.dart';

import '../../core/i18n.dart';
import '../../core/money.dart';
import '../../data/models.dart';
import '../../data/store.dart';
import '../../widgets/common.dart';

class ExpenseDetailPage extends StatelessWidget {
  const ExpenseDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    final expense = store.expenseById(id);
    if (expense == null) {
      return Scaffold(appBar: AppBar(), body: const Center(child: Text('Expense not found')));
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(expense.vendor),
        actions: [
          IconButton(onPressed: () => context.go('/expenses/$id/edit'), icon: const Icon(Icons.edit_outlined)),
          IconButton(
            onPressed: () async {
              if (!await confirmDelete(context, 'expense')) return;
              await store.deleteExpense(id);
              if (context.mounted) context.go('/expenses');
            },
            icon: const Icon(Icons.delete_outline),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(formatMoney(expense.amount, expense.currency), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text([
            formatDate(expense.date),
            if (expense.category.isNotEmpty) expense.category,
            tr(Language.en, expense.paymentMethod.key),
          ].join(' · ')),
          if (expense.notes.isNotEmpty) ...[
            const SizedBox(height: 16),
            Card(child: Padding(padding: const EdgeInsets.all(16), child: Text(expense.notes))),
          ],
          const SizedBox(height: 16),
          FutureBuilder<StoredFile?>(
            future: store.getFile(id),
            builder: (context, snap) {
              final file = snap.data;
              if (file == null) {
                return const Text('No attachment', style: TextStyle(color: Color(0xFF64748B)));
              }
              final isPdf = file.mime.contains('pdf');
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: OutlinedButton.icon(
                      onPressed: () => Printing.sharePdf(
                        bytes: Uint8List.fromList(file.bytes),
                        filename: file.name.endsWith('.pdf') ? file.name : '${file.name}.pdf',
                      ),
                      icon: const Icon(Icons.ios_share),
                      label: const Text('Share attachment'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (isPdf)
                    SizedBox(
                      height: 480,
                      child: PdfPreview(
                        build: (_) async => Uint8List.fromList(file.bytes),
                        canChangePageFormat: false,
                        allowPrinting: false,
                        allowSharing: false,
                        canDebug: false,
                      ),
                    )
                  else
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.memory(Uint8List.fromList(file.bytes), fit: BoxFit.contain),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
