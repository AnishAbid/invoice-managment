import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../data/store.dart';
import '../../widgets/common.dart';

class ReportsPage extends StatelessWidget {
  const ReportsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    final months = store.lastSixMonths();
    final byCat = store.expensesByCategory();
    final stats = store.dashboard;

    return Scaffold(
      appBar: AppBar(title: const Text('Reports')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('This month', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          StatCard(label: 'Collected', value: stats.collectedThisMonth.format()),
          const SizedBox(height: 8),
          StatCard(label: 'Spent', value: stats.spentThisMonth.format()),
          const SizedBox(height: 8),
          StatCard(label: 'Outstanding', value: stats.outstanding.format(), hint: '${stats.overdueCount} overdue invoices'),
          const SizedBox(height: 20),
          const Text('Last six months', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                for (final m in months)
                  ListTile(
                    title: Text(m.label),
                    subtitle: Text('In ${m.income.format()}  ·  Out ${m.expenses.format()}'),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('Expenses by category', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          if (byCat.isEmpty)
            const Text('No expenses recorded yet.', style: TextStyle(color: RaseedColors.muted))
          else
            Card(
              child: Column(
                children: [
                  for (final row in byCat)
                    ListTile(
                      title: Text(row.$1),
                      trailing: Text(row.$2.format(), style: const TextStyle(fontWeight: FontWeight.w600)),
                    ),
                ],
              ),
            ),
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                '${stats.invoiceCount} invoices · ${stats.expenseCount} expenses · ${stats.receiptCount} receipts · ${stats.clientCount} clients',
                style: const TextStyle(color: RaseedColors.muted),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
