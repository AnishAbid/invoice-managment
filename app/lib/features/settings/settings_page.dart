import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/store.dart';
import '../../widgets/common.dart';
import '../../widgets/form_fields.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  late BusinessProfile profile;
  bool saved = false;

  @override
  void initState() {
    super.initState();
    profile = context.read<LedgerStore>().profile;
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Business profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('Used as the “from” party on invoices and as the default for new documents.',
              style: TextStyle(color: RaseedColors.muted)),
          const SizedBox(height: 12),
          LabeledField(
            label: 'Business name',
            child: TextFormField(initialValue: profile.name, onChanged: (v) => profile = profile.copyWith(name: v)),
          ),
          const SizedBox(height: 12),
          LabeledField(
            label: 'Phone',
            child: TextFormField(initialValue: profile.phone, onChanged: (v) => profile = profile.copyWith(phone: v)),
          ),
          const SizedBox(height: 12),
          LabeledField(
            label: 'Email',
            child: TextFormField(initialValue: profile.email, onChanged: (v) => profile = profile.copyWith(email: v)),
          ),
          const SizedBox(height: 12),
          LabeledField(
            label: 'Address',
            child: TextFormField(initialValue: profile.address, minLines: 2, maxLines: 3, onChanged: (v) => profile = profile.copyWith(address: v)),
          ),
          const SizedBox(height: 12),
          LabeledField(
            label: 'Tax ID / NTN',
            child: TextFormField(initialValue: profile.taxId, onChanged: (v) => profile = profile.copyWith(taxId: v)),
          ),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(
              child: LabeledField(
                label: 'Default currency',
                child: CurrencyPicker(value: profile.defaultCurrency, onChanged: (v) => setState(() => profile = profile.copyWith(defaultCurrency: v))),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: LabeledField(
                label: 'Default language',
                child: LanguagePicker(value: profile.defaultLanguage, onChanged: (v) => setState(() => profile = profile.copyWith(defaultLanguage: v))),
              ),
            ),
          ]),
          const SizedBox(height: 12),
          LabeledField(
            label: 'Invoice due days',
            child: TextFormField(
              initialValue: profile.invoiceDueDays.toString(),
              keyboardType: TextInputType.number,
              onChanged: (v) => profile = profile.copyWith(invoiceDueDays: int.tryParse(v) ?? 14),
            ),
          ),
          const SizedBox(height: 12),
          LabeledField(
            label: 'Default tax %',
            child: TextFormField(
              initialValue: profile.defaultTaxPercent == 0 ? '' : profile.defaultTaxPercent.toString(),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              onChanged: (v) => profile = profile.copyWith(defaultTaxPercent: double.tryParse(v) ?? 0),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () async {
              await store.saveProfile(profile);
              setState(() => saved = true);
            },
            icon: const Icon(Icons.save_outlined),
            label: Text(saved ? 'Saved' : 'Save profile'),
          ),
          const SizedBox(height: 28),
          const Text('Data', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          const Text('Everything is stored privately on this device — the same idea as the original browser ledger.',
              style: TextStyle(color: RaseedColors.muted)),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: store.loadDemo, child: const Text('Load sample data')),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: () async {
              if (!await confirmDelete(context, 'all local data')) return;
              await store.clearAll();
              setState(() => profile = store.profile);
            },
            child: const Text('Erase all data', style: TextStyle(color: Color(0xFFB91C1C))),
          ),
        ],
      ),
    );
  }
}
