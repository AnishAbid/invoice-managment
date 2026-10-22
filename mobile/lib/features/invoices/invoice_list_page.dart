import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/money.dart';
import '../../data/models.dart';
import '../../data/store.dart';
import '../../widgets/common.dart';

class InvoiceListPage extends StatefulWidget {
  const InvoiceListPage({super.key});

  @override
  State<InvoiceListPage> createState() => _InvoiceListPageState();
}

class _InvoiceListPageState extends State<InvoiceListPage> {
  final query = TextEditingController();
  InvoiceStatus? filter;

  @override
  void dispose() {
    query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    final q = query.text.trim().toLowerCase();
    final visible = store.invoices.where((inv) {
      if (filter != null && inv.effectiveStatus != filter) return false;
      if (q.isEmpty) return true;
      final hay = '${inv.number} ${inv.title} ${inv.category ?? ''} ${inv.data.customer.phone}'.toLowerCase();
      return hay.contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Invoices')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/invoices/new'),
        icon: const Icon(Icons.add),
        label: const Text('New invoice'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SearchField(controller: query, hint: 'Search client, invoice no…', onChanged: (_) => setState(() {})),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                ChoiceChip(label: const Text('All'), selected: filter == null, onSelected: (_) => setState(() => filter = null)),
                const SizedBox(width: 8),
                for (final s in [InvoiceStatus.draft, InvoiceStatus.sent, InvoiceStatus.paid, InvoiceStatus.overdue]) ...[
                  ChoiceChip(
                    label: Text(s.name[0].toUpperCase() + s.name.substring(1)),
                    selected: filter == s,
                    onSelected: (_) => setState(() => filter = s),
                  ),
                  const SizedBox(width: 8),
                ],
              ],
            ),
          ),
          Expanded(
            child: store.invoices.isEmpty
                ? Padding(
                    padding: const EdgeInsets.all(16),
                    child: EmptyState(
                      icon: Icons.request_quote_outlined,
                      title: 'No invoices yet',
                      message: 'Bill a client with line items, tax and due dates. Mark paid to mint a receipt automatically.',
                      actionLabel: 'Create invoice',
                      onAction: () => context.go('/invoices/new'),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 88),
                    itemCount: visible.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, i) {
                      final inv = visible[i];
                      return Card(
                        child: ListTile(
                          title: Text(inv.title),
                          subtitle: Text('${inv.number} · ${formatShortDate(inv.date)}${inv.dueDate.isEmpty ? '' : ' · due ${formatShortDate(inv.dueDate)}'}'),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              MoneyLabel(inv.total, inv.currency),
                              const SizedBox(height: 4),
                              StatusChip(status: inv.effectiveStatus),
                            ],
                          ),
                          onTap: () => context.go('/invoices/${inv.id}'),
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
