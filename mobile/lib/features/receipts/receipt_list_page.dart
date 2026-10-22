import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/money.dart';
import '../../data/models.dart';
import '../../data/store.dart';
import '../../widgets/common.dart';

class ReceiptListPage extends StatefulWidget {
  const ReceiptListPage({super.key});

  @override
  State<ReceiptListPage> createState() => _ReceiptListPageState();
}

class _ReceiptListPageState extends State<ReceiptListPage> {
  final query = TextEditingController();
  ReceiptKind? filter;

  @override
  void dispose() {
    query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    final q = query.text.trim().toLowerCase();
    final visible = store.receipts.where((r) {
      if (filter != null && r.kind != filter) return false;
      if (q.isEmpty) return true;
      final extra = r.kind == ReceiptKind.generated ? r.data?.number : r.fileName;
      return '${r.title} ${r.category ?? ''} ${r.notes ?? ''} $extra'.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Receipts')),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          FloatingActionButton.small(
            heroTag: 'upload',
            onPressed: () => context.go('/receipts/upload'),
            child: const Icon(Icons.upload_outlined),
          ),
          const SizedBox(height: 10),
          FloatingActionButton.extended(
            heroTag: 'generate',
            onPressed: () => context.go('/receipts/new'),
            icon: const Icon(Icons.add),
            label: const Text('Generate'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SearchField(controller: query, hint: 'Search vendor, receipt no., category…', onChanged: (_) => setState(() {})),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                ChoiceChip(label: const Text('All'), selected: filter == null, onSelected: (_) => setState(() => filter = null)),
                const SizedBox(width: 8),
                ChoiceChip(label: const Text('Generated'), selected: filter == ReceiptKind.generated, onSelected: (_) => setState(() => filter = ReceiptKind.generated)),
                const SizedBox(width: 8),
                ChoiceChip(label: const Text('Uploaded'), selected: filter == ReceiptKind.uploaded, onSelected: (_) => setState(() => filter = ReceiptKind.uploaded)),
              ],
            ),
          ),
          Expanded(
            child: store.receipts.isEmpty
                ? Padding(
                    padding: const EdgeInsets.all(16),
                    child: EmptyState(
                      icon: Icons.receipt_long_outlined,
                      title: 'Keep every payment on record',
                      message: 'Generate a digital slip when the shop does not give one, or upload a photo of a paper receipt.',
                      actionLabel: 'Generate receipt',
                      onAction: () => context.go('/receipts/new'),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
                    itemCount: visible.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, i) {
                      final r = visible[i];
                      return Card(
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: r.kind == ReceiptKind.generated ? const Color(0xFFECFDF5) : const Color(0xFFE0F2FE),
                            child: Icon(
                              r.kind == ReceiptKind.generated ? Icons.receipt_long : Icons.image_outlined,
                              color: r.kind == ReceiptKind.generated ? const Color(0xFF047857) : const Color(0xFF0369A1),
                            ),
                          ),
                          title: Text(r.title),
                          subtitle: Text([
                            formatShortDate(r.date),
                            r.kind == ReceiptKind.generated ? (r.data?.number ?? '') : (r.fileName ?? ''),
                            if (r.category != null) r.category!,
                          ].where((s) => s.isNotEmpty).join(' · ')),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              MoneyLabel(r.total, r.currency),
                              Text(r.kind.name, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                            ],
                          ),
                          onTap: () => context.go('/receipts/${r.id}'),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
