import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/money.dart';
import '../../core/theme.dart';
import '../../data/store.dart';
import '../../widgets/common.dart';
import '../shell/app_shell.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    final stats = store.dashboard;
    final recentInvoices = store.invoices.take(4).toList();
    final recentExpenses = store.expenses.take(4).toList();
    final empty = store.invoices.isEmpty && store.expenses.isEmpty && store.receipts.isEmpty;

    return Scaffold(
      appBar: AppBar(title: const BrandTitle()),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          const Text('Overview', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('Invoices, expenses and receipts in one private ledger.',
              style: TextStyle(color: RaseedColors.muted)),
          const SizedBox(height: 16),
          if (!store.profile.isComplete)
            Card(
              color: const Color(0xFFECFDF5),
              child: ListTile(
                leading: const Icon(Icons.storefront_outlined, color: RaseedColors.emerald),
                title: const Text('Add your business details'),
                subtitle: const Text('Name and address appear on every invoice.'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/settings'),
              ),
            ),
          const SizedBox(height: 8),
          GridView.count(
            crossAxisCount: MediaQuery.sizeOf(context).width > 720 ? 4 : 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.45,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            children: [
              StatCard(label: 'Collected this month', value: stats.collectedThisMonth.format(), icon: Icons.south_west),
              StatCard(label: 'Spent this month', value: stats.spentThisMonth.format(), icon: Icons.north_east),
              StatCard(label: 'Outstanding', value: stats.outstanding.format(), hint: stats.overdueCount == 0 ? null : '${stats.overdueCount} overdue', icon: Icons.schedule),
              StatCard(label: 'Invoiced this month', value: stats.invoicedThisMonth.format(), icon: Icons.request_quote_outlined),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              FilledButton.icon(onPressed: () => context.go('/invoices/new'), icon: const Icon(Icons.add), label: const Text('New invoice')),
              OutlinedButton.icon(onPressed: () => context.go('/expenses/new'), icon: const Icon(Icons.add), label: const Text('Add expense')),
              OutlinedButton.icon(onPressed: () => context.go('/receipts/new'), icon: const Icon(Icons.receipt_long_outlined), label: const Text('Generate receipt')),
              OutlinedButton.icon(onPressed: () => context.go('/receipts/upload'), icon: const Icon(Icons.upload_outlined), label: const Text('Upload slip')),
            ],
          ),
          const SizedBox(height: 20),
          if (empty)
            EmptyState(
              icon: Icons.auto_graph,
              title: 'Start your books',
              message: 'Create an invoice, log an expense, or load sample data to see how Raseed works.',
              actionLabel: 'Load sample data',
              onAction: () => store.loadDemo(),
            )
          else ...[
            _RecentBlock(
              title: 'Recent invoices',
              onSeeAll: () => context.go('/invoices'),
              children: [
                if (recentInvoices.isEmpty) const ListTile(title: Text('No invoices yet')),
                for (final inv in recentInvoices)
                  ListTile(
                    title: Text(inv.title),
                    subtitle: Text('${inv.number} · ${formatShortDate(inv.date)}'),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        MoneyLabel(inv.total, inv.currency),
                        StatusChip(status: inv.effectiveStatus),
                      ],
                    ),
                    onTap: () => context.go('/invoices/${inv.id}'),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            _RecentBlock(
              title: 'Recent expenses',
              onSeeAll: () => context.go('/expenses'),
              children: [
                if (recentExpenses.isEmpty) const ListTile(title: Text('No expenses yet')),
                for (final exp in recentExpenses)
                  ListTile(
                    title: Text(exp.vendor),
                    subtitle: Text('${exp.category.isEmpty ? 'Uncategorized' : exp.category} · ${formatShortDate(exp.date)}'),
                    trailing: MoneyLabel(exp.amount, exp.currency),
                    onTap: () => context.go('/expenses/${exp.id}'),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _RecentBlock extends StatelessWidget {
  const _RecentBlock({required this.title, required this.onSeeAll, required this.children});

  final String title;
  final VoidCallback onSeeAll;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          ListTile(
            title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
            trailing: TextButton(onPressed: onSeeAll, child: const Text('See all')),
          ),
          ...children,
        ],
      ),
    );
  }
}
