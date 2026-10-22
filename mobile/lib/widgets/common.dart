import 'package:flutter/material.dart';

import '../core/i18n.dart';
import '../core/money.dart';
import '../core/theme.dart';
import '../data/models.dart';

class StatCard extends StatelessWidget {
  const StatCard({super.key, required this.label, required this.value, this.hint, this.icon});

  final String label;
  final String value;
  final String? hint;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 16, color: RaseedColors.muted),
                  const SizedBox(width: 6),
                ],
                Expanded(
                  child: Text(label, style: const TextStyle(color: RaseedColors.muted, fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(value, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            if (hint != null) ...[
              const SizedBox(height: 4),
              Text(hint!, style: const TextStyle(color: RaseedColors.muted, fontSize: 12)),
            ],
          ],
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: const Color(0xFFECFDF5),
              child: Icon(icon, color: RaseedColors.emerald),
            ),
            const SizedBox(height: 16),
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: RaseedColors.muted)),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 16),
              FilledButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});

  final InvoiceStatus status;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, label) = switch (status) {
      InvoiceStatus.draft => (const Color(0xFFF1F5F9), const Color(0xFF475569), 'Draft'),
      InvoiceStatus.sent => (const Color(0xFFDBEAFE), const Color(0xFF1D4ED8), 'Sent'),
      InvoiceStatus.paid => (const Color(0xFFD1FAE5), const Color(0xFF047857), 'Paid'),
      InvoiceStatus.overdue => (const Color(0xFFFEE2E2), const Color(0xFFB91C1C), 'Overdue'),
      InvoiceStatus.cancelled => (const Color(0xFFE2E8F0), const Color(0xFF64748B), 'Cancelled'),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(99)),
      child: Text(label, style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

class SearchField extends StatelessWidget {
  const SearchField({super.key, required this.controller, required this.hint, this.onChanged});

  final TextEditingController controller;
  final String hint;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: const Icon(Icons.search),
        suffixIcon: controller.text.isEmpty
            ? null
            : IconButton(onPressed: () { controller.clear(); onChanged?.call(''); }, icon: const Icon(Icons.close)),
      ),
    );
  }
}

class MoneyLabel extends StatelessWidget {
  const MoneyLabel(this.amount, this.currency, {super.key, this.language = Language.en, this.style});

  final double amount;
  final Currency currency;
  final Language language;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    return Text(formatMoney(amount, currency, language), style: style ?? const TextStyle(fontWeight: FontWeight.w600));
  }
}

class PaymentMethodLabel extends StatelessWidget {
  const PaymentMethodLabel(this.method, {super.key, this.language = Language.en});

  final PaymentMethod method;
  final Language language;

  @override
  Widget build(BuildContext context) => Text(tr(language, method.key));
}

class SectionCard extends StatelessWidget {
  const SectionCard({super.key, required this.title, required this.child, this.trailing});

  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.w600))),
                ?trailing,
              ],
            ),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

Future<bool> confirmDelete(BuildContext context, String noun) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text('Delete $noun?'),
      content: Text('This cannot be undone.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: const Color(0xFFB91C1C)),
          onPressed: () => Navigator.pop(ctx, true),
          child: const Text('Delete'),
        ),
      ],
    ),
  );
  return ok == true;
}
