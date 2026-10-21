import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/i18n.dart';
import '../../core/money.dart';
import '../../data/store.dart';
import '../../widgets/common.dart';

class ExpenseListPage extends StatefulWidget {
  const ExpenseListPage({super.key});

  @override
  State<ExpenseListPage> createState() => _ExpenseListPageState();
}

class _ExpenseListPageState extends State<ExpenseListPage> {
  final query = TextEditingController();
  String category = '';

  @override
  void dispose() {
    query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    final q = query.text.trim().toLowerCase();
    final visible = store.expenses.where((e) {
      if (category.isNotEmpty && e.category != category) return false;
      if (q.isEmpty) return true;
      return '${e.vendor} ${e.category} ${e.notes}'.toLowerCase().contains(q);
    }).toList();
    final cats = {
      for (final e in store.expenses)
        if (e.category.isNotEmpty) e.category,
    }.toList()
      ..sort();

    return Scaffold(
      appBar: AppBar(title: const Text('Expenses')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/expenses/new'),
        icon: const Icon(Icons.add),
        label: const Text('Add expense'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SearchField(controller: query, hint: 'Search vendor, category…', onChanged: (_) => setState(() {})),
          ),
          if (cats.isNotEmpty)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                children: [
                  ChoiceChip(label: const Text('All'), selected: category.isEmpty, onSelected: (_) => setState(() => category = '')),
                  const SizedBox(width: 8),
                  for (final c in cats) ...[
                    ChoiceChip(label: Text(c), selected: category == c, onSelected: (_) => setState(() => category = c)),
                    const SizedBox(width: 8),
                  ],
                ],
              ),
            ),
          Expanded(
            child: store.expenses.isEmpty
                ? Padding(
                    padding: const EdgeInsets.all(16),
                    child: EmptyState(
                      icon: Icons.payments_outlined,
                      title: 'No expenses yet',
                      message: 'Log fuel, rent, utilities and other costs. Attach a photo of the slip if you have one.',
                      actionLabel: 'Add expense',
                      onAction: () => context.go('/expenses/new'),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
                    itemCount: visible.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, i) {
                      final e = visible[i];
                      return Card(
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: const Color(0xFFECFDF5),
                            child: Icon(e.hasFile ? Icons.attach_file : Icons.payments_outlined, color: const Color(0xFF047857)),
                          ),
                          title: Text(e.vendor),
                          subtitle: Text(
                            [
                              formatShortDate(e.date),
                              if (e.category.isNotEmpty) e.category,
                              tr(store.profile.defaultLanguage, e.paymentMethod.key),
                            ].join(' · '),
                          ),
                          trailing: MoneyLabel(e.amount, e.currency),
                          onTap: () => context.go('/expenses/${e.id}'),
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
