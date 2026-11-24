import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/constants.dart';
import '../../core/ids.dart';
import '../../data/models.dart';
import '../../data/store.dart';
import '../../widgets/form_fields.dart';

class _Draft {
  _Draft({
    required this.id,
    required this.file,
    required this.title,
    required this.date,
  });

  final String id;
  final StoredFile file;
  String title;
  String date;
  String total = '';
  Currency currency = Currency.pkr;
  String category = '';
  String notes = '';
}

class ReceiptUploadPage extends StatefulWidget {
  const ReceiptUploadPage({super.key});

  @override
  State<ReceiptUploadPage> createState() => _ReceiptUploadPageState();
}

class _ReceiptUploadPageState extends State<ReceiptUploadPage> {
  final drafts = <_Draft>[];
  String? error;
  bool saving = false;

  Future<void> _addFiles() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      withData: true,
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf'],
    );
    if (result == null) return;
    final next = <_Draft>[];
    for (final f in result.files) {
      if (f.bytes == null || f.size > 20 * 1024 * 1024) continue;
      final mime = (f.extension ?? '').toLowerCase() == 'pdf' ? 'application/pdf' : 'image/${f.extension}';
      next.add(_Draft(
        id: newId(),
        file: StoredFile(bytes: f.bytes!, name: f.name, mime: mime),
        title: f.name.replaceAll(RegExp(r'\.[^.]+$'), '').replaceAll(RegExp(r'[_-]+'), ' '),
        date: todayIso(),
      ));
    }
    setState(() => drafts.addAll(next));
  }

  Future<void> _camera() async {
    final shot = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 85);
    if (shot == null) return;
    final bytes = await shot.readAsBytes();
    setState(() {
      drafts.add(_Draft(
        id: newId(),
        file: StoredFile(bytes: bytes, name: shot.name, mime: shot.mimeType ?? 'image/jpeg'),
        title: shot.name.replaceAll(RegExp(r'\.[^.]+$'), ''),
        date: todayIso(),
      ));
    });
  }

  Future<void> _save() async {
    if (drafts.any((d) => d.title.trim().isEmpty)) {
      setState(() => error = 'Every receipt needs a vendor / title.');
      return;
    }
    setState(() {
      saving = true;
      error = null;
    });
    final store = context.read<LedgerStore>();
    final now = DateTime.now().millisecondsSinceEpoch;
    String? lastId;
    for (var i = 0; i < drafts.length; i++) {
      final d = drafts[i];
      final receipt = Receipt(
        id: newId(),
        kind: ReceiptKind.uploaded,
        title: d.title.trim(),
        date: d.date,
        total: double.tryParse(d.total) ?? 0,
        currency: d.currency,
        category: d.category.isEmpty ? null : d.category,
        notes: d.notes.trim().isEmpty ? null : d.notes.trim(),
        fileName: d.file.name,
        fileMime: d.file.mime,
        createdAt: now + i,
        updatedAt: now + i,
      );
      await store.saveReceipt(receipt, file: d.file);
      lastId = receipt.id;
    }
    if (!mounted) return;
    context.go(drafts.length == 1 ? '/receipts/$lastId' : '/receipts');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Upload receipts')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Add photos of paper slips or PDF bills. You can add several at once.',
              style: TextStyle(color: Color(0xFF64748B))),
          const SizedBox(height: 16),
          Card(
            child: InkWell(
              onTap: _addFiles,
              child: const Padding(
                padding: EdgeInsets.all(28),
                child: Column(
                  children: [
                    Icon(Icons.cloud_upload_outlined, size: 36, color: Color(0xFF047857)),
                    SizedBox(height: 8),
                    Text('Tap to browse files', style: TextStyle(fontWeight: FontWeight.w600)),
                    Text('JPG, PNG, HEIC, WEBP or PDF · up to 20 MB', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(onPressed: _camera, icon: const Icon(Icons.photo_camera_outlined), label: const Text('Take a photo')),
          const SizedBox(height: 16),
          if (error != null) Text(error!, style: const TextStyle(color: Color(0xFFB91C1C))),
          for (final d in drafts)
            Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(d.file.name, overflow: TextOverflow.ellipsis)),
                        IconButton(
                          onPressed: () => setState(() => drafts.removeWhere((x) => x.id == d.id)),
                          icon: const Icon(Icons.close),
                        ),
                      ],
                    ),
                    LabeledField(
                      label: 'Vendor / title *',
                      child: TextFormField(initialValue: d.title, onChanged: (v) => d.title = v),
                    ),
                    const SizedBox(height: 8),
                    Row(children: [
                      Expanded(
                        child: LabeledField(
                          label: 'Date',
                          child: IsoDatePicker(value: d.date, onChanged: (v) => setState(() => d.date = v)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: LabeledField(
                          label: 'Amount',
                          child: TextFormField(
                            initialValue: d.total,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            onChanged: (v) => d.total = v,
                          ),
                        ),
                      ),
                    ]),
                    const SizedBox(height: 8),
                    Row(children: [
                      Expanded(
                        child: LabeledField(
                          label: 'Currency',
                          child: CurrencyPicker(value: d.currency, onChanged: (v) => setState(() => d.currency = v)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: LabeledField(
                          label: 'Category',
                          child: CategoryPicker(value: d.category, options: expenseCategories, onChanged: (v) => setState(() => d.category = v)),
                        ),
                      ),
                    ]),
                    const SizedBox(height: 8),
                    LabeledField(
                      label: 'Notes',
                      child: TextFormField(initialValue: d.notes, onChanged: (v) => d.notes = v),
                    ),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text('${(d.file.bytes.length / 1024).toStringAsFixed(0)} KB',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          if (drafts.isNotEmpty)
            FilledButton.icon(
              onPressed: saving ? null : _save,
              icon: const Icon(Icons.save_outlined),
              label: Text('Save ${drafts.length} receipt${drafts.length == 1 ? '' : 's'}'),
            ),
        ],
      ),
    );
  }
}
