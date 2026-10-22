import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../data/store.dart';
import '../shell/app_shell.dart';

class MorePage extends StatelessWidget {
  const MorePage({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    return Scaffold(
      appBar: AppBar(title: const BrandTitle()),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.people_outline),
                  title: const Text('Clients'),
                  subtitle: Text('${store.clients.length} saved'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.go('/clients'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.bar_chart_outlined),
                  title: const Text('Reports'),
                  subtitle: const Text('Income, spend and categories'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.go('/reports'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.settings_outlined),
                  title: const Text('Settings'),
                  subtitle: Text(store.profile.isComplete ? store.profile.name : 'Business profile and defaults'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.go('/settings'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('About Raseed', style: TextStyle(fontWeight: FontWeight.w700)),
                  SizedBox(height: 8),
                  Text(
                    'A complete invoicing and expense app ported from the Raseed web ledger. '
                    'Create invoices, track expenses, generate English/Urdu receipts, and export PDFs. '
                    'Your books stay on this device.',
                    style: TextStyle(color: RaseedColors.muted),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
