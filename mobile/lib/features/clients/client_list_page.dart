import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/ids.dart';
import '../../data/models.dart';
import '../../data/store.dart';
import '../../widgets/common.dart';
import '../../widgets/form_fields.dart';

class ClientListPage extends StatefulWidget {
  const ClientListPage({super.key});

  @override
  State<ClientListPage> createState() => _ClientListPageState();
}

class _ClientListPageState extends State<ClientListPage> {
  final query = TextEditingController();

  @override
  void dispose() {
    query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<LedgerStore>();
    final q = query.text.trim().toLowerCase();
    final visible = store.clients.where((c) {
      if (q.isEmpty) return true;
      return '${c.name} ${c.phone} ${c.email} ${c.address}'.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Clients')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _edit(context),
        icon: const Icon(Icons.add),
        label: const Text('Add client'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: SearchField(controller: query, hint: 'Search clients…', onChanged: (_) => setState(() {})),
          ),
          Expanded(
            child: store.clients.isEmpty
                ? Padding(
                    padding: const EdgeInsets.all(16),
                    child: EmptyState(
                      icon: Icons.people_outline,
                      title: 'No clients yet',
                      message: 'Save the people and businesses you invoice so you do not retype details every time.',
                      actionLabel: 'Add client',
                      onAction: () => _edit(context),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 88),
                    itemCount: visible.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, i) {
                      final c = visible[i];
                      final open = store.invoices.where((inv) => inv.clientId == c.id && inv.status != InvoiceStatus.paid && inv.status != InvoiceStatus.cancelled).length;
                      return Card(
                        child: ListTile(
                          leading: CircleAvatar(child: Text(c.name.isEmpty ? '?' : c.name.characters.first.toUpperCase())),
                          title: Text(c.name),
                          subtitle: Text([c.phone, c.email].where((s) => s.isNotEmpty).join(' · ')),
                          trailing: open == 0 ? null : Text('$open open'),
                          onTap: () => _edit(context, client: c),
                          onLongPress: () async {
                            if (!await confirmDelete(context, 'client')) return;
                            await store.deleteClient(c.id);
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Future<void> _edit(BuildContext context, {Client? client}) async {
    final store = context.read<LedgerStore>();
    var party = client?.asParty ?? const Party();
    var notes = client?.notes ?? '';
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(left: 16, right: 16, bottom: MediaQuery.viewInsetsOf(ctx).bottom + 24),
          child: StatefulBuilder(
            builder: (ctx, setModal) {
              return SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(client == null ? 'New client' : 'Edit client', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    PartyFields(
                      key: ValueKey(client?.id ?? 'new'),
                      party: party,
                      requiredName: true,
                      onChanged: (p) => setModal(() => party = p),
                    ),
                    const SizedBox(height: 12),
                    LabeledField(
                      label: 'Notes',
                      child: TextFormField(initialValue: notes, minLines: 2, maxLines: 3, onChanged: (v) => notes = v),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: party.name.trim().isEmpty
                          ? null
                          : () async {
                              final now = DateTime.now().millisecondsSinceEpoch;
                              await store.saveClient(
                                Client(
                                  id: client?.id ?? newId(),
                                  name: party.name.trim(),
                                  phone: party.phone,
                                  email: party.email,
                                  address: party.address,
                                  notes: notes,
                                  createdAt: client?.createdAt ?? now,
                                  updatedAt: now,
                                ),
                              );
                              if (ctx.mounted) Navigator.pop(ctx, true);
                            },
                      child: const Text('Save client'),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
    if (saved == true && mounted) setState(() {});
  }
}
