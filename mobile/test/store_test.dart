import 'package:flutter_test/flutter_test.dart';
import 'package:raseed/core/ids.dart';
import 'package:raseed/data/models.dart';
import 'package:raseed/data/store.dart';
import 'package:sembast/sembast_memory.dart';

void main() {
  late LedgerStore store;

  setUp(() async {
    final db = await databaseFactoryMemory.openDatabase(newId());
    store = LedgerStore(database: db);
    await store.init();
  });

  tearDown(() => store.dispose());

  test('saves invoices, expenses and receipts locally', () async {
    final invoice = Invoice(
      id: 'inv-1',
      number: 'INV-202610-0001',
      status: InvoiceStatus.sent,
      data: DocumentData(
        number: 'INV-202610-0001',
        date: todayIso(),
        customer: const Party(name: 'Ahmed Ali'),
        items: [LineItem(id: 'i', description: 'Work', quantity: 1, unitPrice: 1000)],
      ),
      createdAt: 1,
      updatedAt: 1,
    );
    await store.saveInvoice(invoice, consumeNumber: true);
    expect(store.invoices, hasLength(1));
    expect(store.invoices.first.total, 1000);

    await store.saveExpense(
      Expense(
        id: 'exp-1',
        vendor: 'Shell',
        date: todayIso(),
        amount: 500,
        currency: Currency.pkr,
        category: 'Fuel',
        createdAt: 2,
        updatedAt: 2,
      ),
    );
    expect(store.expenses, hasLength(1));

    final receipt = await store.markInvoicePaid(store.invoices.first);
    expect(store.invoices.first.status, InvoiceStatus.paid);
    expect(receipt.kind, ReceiptKind.generated);
    expect(store.receipts, hasLength(1));
  });

  test('sequential invoice numbers increment', () async {
    final a = await store.peekNumber('INV');
    final taken = await store.takeNumber('INV');
    final b = await store.peekNumber('INV');
    expect(taken, a);
    expect(b.endsWith('0002'), isTrue);
  });
}
