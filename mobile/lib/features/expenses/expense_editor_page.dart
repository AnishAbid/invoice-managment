import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/ids.dart';
import '../../data/models.dart';
import '../../data/store.dart';
import '../../widgets/form_fields.dart';

class ExpenseEditorPage extends StatefulWidget {
  const ExpenseEditorPage({super.key, this.id});

  final String? id;

  @override
  State<ExpenseEditorPage> createState() => _ExpenseEditorPageState();
}

class _ExpenseEditorPageState extends State<ExpenseEditorPage> {
  late Expense expense;
  StoredFile? pendingFile;
  String? error;
  bool saving = false;

  @override
  void initState() {
    super.initState();
    final store = context.read<LedgerStore>();
    final existing = widget.id == null ? null : store.expenseById(widget.id!);
    expense = existing ??
        Expense(
          id: newId(),
          vendor: '',
          date: todayIso(),
          amount: 0,
          currency: store.profile.defaultCurrency,
          createdAt: DateTime.now().millisecondsSinceEpoch,
          updatedAt: DateTime.now().millisecondsSinceEpoch,
        );
  }

  Future<void> _pick({required bool camera}) async {
    if (camera) {
      final shot = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 85);
      if (shot == null) return;
      final bytes = await shot.readAsBytes();
      setState(() {
        pendingFile = StoredFile(bytes: bytes, name: shot.name, mime: shot.mimeType ?? 'image/jpeg');
        expense = expense.copyWith(fileName: shot.name, fileMime: shot.mimeType ?? 'image/jpeg');
      });
      return;
    }
    final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf'], withData: true);
    final file = result?.files.single;
    if (file?.bytes == null) return;
    setState(() {
      pendingFile = StoredFile(bytes: file!.bytes!, name: file.name, mime: file.extension == 'pdf' ? 'application/pdf' : 'image/${file.extension}');
      expense = expense.copyWith(fileName: file.name, fileMime: pendingFile!.mime);
    });
  }

  Future<void> _save() async {
    if (expense.vendor.trim().isEmpty) {
      setState(() => error = 'Vendor is required.');
      return;
    }
    if (expense.amount <= 0) {
      setState(() => error = 'Enter an amount greater than zero.');
      return;
    }
    setState(() {
      saving = true;
      error = null;
    });
    final store = context.read<LedgerStore>();
    await store.saveExpense(
      expense.copyWith(updatedAt: DateTime.now().millisecondsSinceEpoch),
      file: pendingFile,
    );
    if (mounted) context.go('/expenses/${expense.id}');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.id == null ? 'Add expense' : 'Edit expense')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          LabeledField(
            label: 'Vendor *',
            child: TextFormField(
              initialValue: expense.vendor,
              decoration: const InputDecoration(hintText: 'Shop, landlord, utility…'),
              onChanged: (v) => setState(() => expense = expense.copyWith(vendor: v)),
            ),
          ),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(
              child: LabeledField(
                label: 'Date',
                child: IsoDatePicker(value: expense.date, onChanged: (v) => setState(() => expense = expense.copyWith(date: v))),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: LabeledField(
                label: 'Amount *',
                child: TextFormField(
                  initialValue: expense.amount == 0 ? '' : expense.amount.toString(),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  onChanged: (v) => setState(() => expense = expense.copyWith(amount: double.tryParse(v) ?? 0)),
                ),
              ),
            ),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(
              child: LabeledField(
                label: 'Currency',
                child: CurrencyPicker(value: expense.currency, onChanged: (v) => setState(() => expense = expense.copyWith(currency: v))),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: LabeledField(
                label: 'Category',
                child: CategoryPicker(value: expense.category, onChanged: (v) => setState(() => expense = expense.copyWith(category: v))),
              ),
            ),
          ]),
          const SizedBox(height: 12),
          LabeledField(
            label: 'Payment method',
            child: PaymentPicker(value: expense.paymentMethod, onChanged: (v) => setState(() => expense = expense.copyWith(paymentMethod: v))),
          ),
          const SizedBox(height: 12),
          LabeledField(
            label: 'Notes',
            child: TextFormField(
              initialValue: expense.notes,
              minLines: 2,
              maxLines: 4,
              onChanged: (v) => setState(() => expense = expense.copyWith(notes: v)),
            ),
          ),
          const SizedBox(height: 16),
          if (expense.fileName != null)
            ListTile(
              leading: const Icon(Icons.attachment),
              title: Text(expense.fileName!),
              trailing: IconButton(
                onPressed: () => setState(() {
                  pendingFile = null;
                  expense = expense.copyWith(clearFile: true);
                }),
                icon: const Icon(Icons.close),
              ),
            ),
          Wrap(
            spacing: 8,
            children: [
              OutlinedButton.icon(onPressed: () => _pick(camera: true), icon: const Icon(Icons.photo_camera_outlined), label: const Text('Camera')),
              OutlinedButton.icon(onPressed: () => _pick(camera: false), icon: const Icon(Icons.upload_outlined), label: const Text('Upload file')),
            ],
          ),
          const SizedBox(height: 20),
          if (error != null) Text(error!, style: const TextStyle(color: Color(0xFFB91C1C))),
          FilledButton.icon(
            onPressed: saving ? null : _save,
            icon: const Icon(Icons.save_outlined),
            label: Text(widget.id == null ? 'Save expense' : 'Save changes'),
          ),
        ],
      ),
    );
  }
}
