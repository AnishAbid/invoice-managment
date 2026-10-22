import 'package:flutter_test/flutter_test.dart';
import 'package:raseed/core/money.dart';
import 'package:raseed/data/models.dart';

void main() {
  test('computeTotals matches the original web ledger rounding', () {
    final totals = computeTotals(
      items: const [
        LineItem(id: '1', description: 'Flour', quantity: 1, unitPrice: 1450),
        LineItem(id: '2', description: 'Milk', quantity: 3, unitPrice: 220),
        LineItem(id: '3', description: 'Sugar', quantity: 2, unitPrice: 160),
      ],
      discountType: DiscountType.amount,
      discountValue: 50,
      taxPercent: 0,
    );
    expect(totals.subtotal, 2430);
    expect(totals.discount, 50);
    expect(totals.tax, 0);
    expect(totals.total, 2380);
  });

  test('percent discount and tax apply after rounding', () {
    final totals = computeTotals(
      items: const [LineItem(id: '1', description: 'Work', quantity: 1, unitPrice: 1000)],
      discountType: DiscountType.percent,
      discountValue: 10,
      taxPercent: 5,
    );
    expect(totals.subtotal, 1000);
    expect(totals.discount, 100);
    expect(totals.tax, 45);
    expect(totals.total, 945);
  });

  test('discount cannot exceed subtotal', () {
    final totals = computeTotals(
      items: const [LineItem(id: '1', description: 'X', quantity: 1, unitPrice: 100)],
      discountType: DiscountType.amount,
      discountValue: 500,
      taxPercent: 0,
    );
    expect(totals.discount, 100);
    expect(totals.total, 0);
  });

  test('PKR amount in words uses lakh/crore', () {
    expect(amountInWords(120000, Currency.pkr), 'Rupees One Lakh Twenty Thousand Only');
    expect(amountInWords(0, Currency.pkr), 'Rupees Zero Only');
  });

  test('USD amount in words uses million scale', () {
    expect(amountInWords(12.5, Currency.usd), 'Twelve Dollars and Fifty Cents Only');
  });

  test('invoice overdue is derived from due date', () {
    final invoice = Invoice(
      id: '1',
      number: 'INV-1',
      status: InvoiceStatus.sent,
      data: DocumentData(date: '2020-01-01', dueDate: '2020-01-02', items: const []),
      createdAt: 0,
      updatedAt: 0,
    );
    expect(invoice.effectiveStatus, InvoiceStatus.overdue);
  });
}
