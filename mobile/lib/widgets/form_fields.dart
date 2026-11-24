import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/constants.dart';
import '../core/i18n.dart';
import '../core/theme.dart';
import '../data/models.dart';

class LabeledField extends StatelessWidget {
  const LabeledField({super.key, required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: RaseedColors.muted)),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}

class PartyFields extends StatelessWidget {
  const PartyFields({
    super.key,
    required this.party,
    required this.onChanged,
    this.nameLabel = 'Name',
    this.nameHint,
    this.requiredName = false,
  });

  final Party party;
  final ValueChanged<Party> onChanged;
  final String nameLabel;
  final String? nameHint;
  final bool requiredName;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        LabeledField(
          label: requiredName ? '$nameLabel *' : nameLabel,
          child: TextFormField(
            initialValue: party.name,
            textDirection: TextDirection.ltr,
            decoration: InputDecoration(hintText: nameHint),
            onChanged: (v) => onChanged(party.copyWith(name: v)),
          ),
        ),
        const SizedBox(height: 12),
        LabeledField(
          label: 'Phone',
          child: TextFormField(
            initialValue: party.phone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(hintText: '03xx-xxxxxxx'),
            onChanged: (v) => onChanged(party.copyWith(phone: v)),
          ),
        ),
        const SizedBox(height: 12),
        LabeledField(
          label: 'Email',
          child: TextFormField(
            initialValue: party.email,
            keyboardType: TextInputType.emailAddress,
            onChanged: (v) => onChanged(party.copyWith(email: v)),
          ),
        ),
        const SizedBox(height: 12),
        LabeledField(
          label: 'Address',
          child: TextFormField(
            initialValue: party.address,
            minLines: 2,
            maxLines: 3,
            onChanged: (v) => onChanged(party.copyWith(address: v)),
          ),
        ),
      ],
    );
  }
}

class LineItemsEditor extends StatelessWidget {
  const LineItemsEditor({super.key, required this.items, required this.onChanged, required this.currency});

  final List<LineItem> items;
  final ValueChanged<List<LineItem>> onChanged;
  final Currency currency;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 4,
                  child: TextFormField(
                    initialValue: item.description,
                    decoration: const InputDecoration(hintText: 'Item or service'),
                    onChanged: (v) => _patch(item.id, description: v),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    initialValue: item.quantity == 0 ? '' : _num(item.quantity),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                    decoration: const InputDecoration(hintText: 'Qty'),
                    onChanged: (v) => _patch(item.id, quantity: double.tryParse(v) ?? 0),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 2,
                  child: TextFormField(
                    initialValue: item.unitPrice == 0 ? '' : _num(item.unitPrice),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(hintText: currency.code),
                    onChanged: (v) => _patch(item.id, unitPrice: double.tryParse(v) ?? 0),
                  ),
                ),
                IconButton(
                  onPressed: items.length == 1 ? null : () => onChanged(items.where((i) => i.id != item.id).toList()),
                  icon: const Icon(Icons.delete_outline),
                ),
              ],
            ),
          ),
        Align(
          alignment: Alignment.centerLeft,
          child: OutlinedButton.icon(
            onPressed: () => onChanged([...items, LineItem.blank()]),
            icon: const Icon(Icons.add),
            label: const Text('Add item'),
          ),
        ),
      ],
    );
  }

  void _patch(String id, {String? description, double? quantity, double? unitPrice}) {
    onChanged([
      for (final item in items)
        if (item.id == id) item.copyWith(description: description, quantity: quantity, unitPrice: unitPrice) else item,
    ]);
  }

  String _num(double n) => n == n.roundToDouble() ? n.toInt().toString() : n.toString();
}

class CurrencyPicker extends StatelessWidget {
  const CurrencyPicker({super.key, required this.value, required this.onChanged});

  final Currency value;
  final ValueChanged<Currency> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<Currency>(
      // ignore: deprecated_member_use
      value: value,
      items: [
        for (final c in Currency.values) DropdownMenuItem(value: c, child: Text(c.code)),
      ],
      onChanged: (v) { if (v != null) onChanged(v); },
    );
  }
}

class LanguagePicker extends StatelessWidget {
  const LanguagePicker({super.key, required this.value, required this.onChanged});

  final Language value;
  final ValueChanged<Language> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<Language>(
      // ignore: deprecated_member_use
      value: value,
      items: const [
        DropdownMenuItem(value: Language.en, child: Text('English')),
        DropdownMenuItem(value: Language.ur, child: Text('اردو (Urdu)')),
      ],
      onChanged: (v) { if (v != null) onChanged(v); },
    );
  }
}

class PaymentPicker extends StatelessWidget {
  const PaymentPicker({super.key, required this.value, required this.onChanged});

  final PaymentMethod value;
  final ValueChanged<PaymentMethod> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<PaymentMethod>(
      // ignore: deprecated_member_use
      value: value,
      items: [
        for (final m in PaymentMethod.values)
          DropdownMenuItem(value: m, child: Text(tr(Language.en, m.key))),
      ],
      onChanged: (v) { if (v != null) onChanged(v); },
    );
  }
}

class CategoryPicker extends StatelessWidget {
  const CategoryPicker({
    super.key,
    required this.value,
    required this.onChanged,
    this.options = expenseCategories,
  });

  final String value;
  final ValueChanged<String> onChanged;
  final List<String> options;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      // ignore: deprecated_member_use
      value: options.contains(value) ? value : '',
      items: [
        const DropdownMenuItem(value: '', child: Text('None')),
        for (final c in options) DropdownMenuItem(value: c, child: Text(c)),
      ],
      onChanged: (v) => onChanged(v ?? ''),
    );
  }
}

class IsoDatePicker extends StatelessWidget {
  const IsoDatePicker({super.key, required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () async {
        final initial = DateTime.tryParse(value) ?? DateTime.now();
        final picked = await showDatePicker(
          context: context,
          initialDate: initial,
          firstDate: DateTime(2018),
          lastDate: DateTime(2040),
        );
        if (picked != null) {
          onChanged(
            '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}',
          );
        }
      },
      child: InputDecorator(
        decoration: const InputDecoration(),
        child: Text(value.isEmpty ? 'Select date' : value),
      ),
    );
  }
}
