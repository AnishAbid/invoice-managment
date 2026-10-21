import '../data/models.dart';

class TemplateMeta {
  const TemplateMeta({
    required this.id,
    required this.name,
    required this.description,
    required this.paper,
  });

  final TemplateId id;
  final String name;
  final String description;
  final PaperSize paper;
}

const templates = [
  TemplateMeta(
    id: TemplateId.classic,
    name: 'Classic',
    description: 'Clean layout with a green accent. Works for almost anything.',
    paper: PaperSize.a4,
  ),
  TemplateMeta(
    id: TemplateId.modern,
    name: 'Modern',
    description: 'Minimal and roomy. The amount is the first thing you see.',
    paper: PaperSize.a4,
  ),
  TemplateMeta(
    id: TemplateId.bold,
    name: 'Bold',
    description: "Dark header band with the vendor's initials. Good for businesses.",
    paper: PaperSize.a4,
  ),
  TemplateMeta(
    id: TemplateId.elegant,
    name: 'Elegant',
    description: 'Serif type, framed border and a PAID stamp. Good for services and rent.',
    paper: PaperSize.a4,
  ),
  TemplateMeta(
    id: TemplateId.memo,
    name: 'Cash Memo',
    description: 'Ruled grid like a shop bill book, with the amount in words.',
    paper: PaperSize.a4,
  ),
  TemplateMeta(
    id: TemplateId.thermal,
    name: 'Thermal slip',
    description: '80 mm till-roll look with monospace type. Prints on POS printers.',
    paper: PaperSize.thermal,
  ),
];

TemplateMeta templateMeta(TemplateId id) =>
    templates.firstWhere((t) => t.id == id, orElse: () => templates.first);

const expenseCategories = [
  'Groceries',
  'Utilities',
  'Fuel',
  'Rent',
  'Medical',
  'Repairs & Services',
  'Food & Dining',
  'Shopping',
  'Travel',
  'Education',
  'Business',
  'Software & Tools',
  'Office supplies',
  'Payroll',
  'Other',
];

const invoiceCategories = [
  'Services',
  'Products',
  'Consulting',
  'Rent',
  'Maintenance',
  'Other',
];
