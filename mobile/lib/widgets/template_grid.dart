import 'package:flutter/material.dart';

import '../core/constants.dart';
import '../core/theme.dart';
import '../data/models.dart';

class TemplateGrid extends StatelessWidget {
  const TemplateGrid({super.key, required this.value, required this.onChanged});

  final TemplateId value;
  final ValueChanged<TemplateId> onChanged;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: MediaQuery.sizeOf(context).width > 700 ? 3 : 2,
      childAspectRatio: 1.15,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      children: [
        for (final tpl in templates)
          InkWell(
            onTap: () => onChanged(tpl.id),
            borderRadius: BorderRadius.circular(16),
            child: Ink(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: tpl.id == value ? RaseedColors.emerald : const Color(0xFFE2E8F0),
                  width: tpl.id == value ? 2 : 1,
                ),
              ),
              child: Stack(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: _swatch(tpl.id)),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(child: Text(tpl.name, style: const TextStyle(fontWeight: FontWeight.w700))),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(4)),
                              child: Text(tpl.paper == PaperSize.thermal ? '80 mm' : 'A4',
                                  style: const TextStyle(fontSize: 10, color: RaseedColors.muted)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(tpl.description, maxLines: 2, overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 11, color: RaseedColors.muted)),
                      ],
                    ),
                  ),
                  if (tpl.id == value)
                    const Positioned(
                      top: 8,
                      right: 8,
                      child: CircleAvatar(
                        radius: 11,
                        backgroundColor: RaseedColors.emerald,
                        child: Icon(Icons.check, size: 14, color: Colors.white),
                      ),
                    ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _swatch(TemplateId id) {
    final colors = switch (id) {
      TemplateId.classic => [RaseedColors.emerald, const Color(0xFFECFDF5)],
      TemplateId.modern => [RaseedColors.indigo, const Color(0xFFEEF2FF)],
      TemplateId.bold => [RaseedColors.ink, RaseedColors.amber],
      TemplateId.elegant => [RaseedColors.gold, const Color(0xFFFDFBF6)],
      TemplateId.memo => [RaseedColors.navy, const Color(0xFFDBEAFE)],
      TemplateId.thermal => [const Color(0xFF111827), const Color(0xFFF8FAFC)],
    };
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: colors,
        ),
      ),
    );
  }
}

DocumentData sampleDocument(DocumentData base) {
  final ur = base.language == Language.ur;
  return base.copyWith(
    number: base.number.isEmpty ? 'INV-000000-0001' : base.number,
    vendor: ur
        ? const Party(name: 'المدینہ جنرل اسٹور', phone: '0300-1234567', address: 'مین بازار، لاہور')
        : const Party(name: 'Al-Madina General Store', phone: '0300-1234567', address: 'Main Bazaar, Lahore'),
    customer: ur ? const Party(name: 'احمد علی') : const Party(name: 'Ahmed Ali'),
    items: ur
        ? [
            LineItem(id: 's1', description: 'آٹا (10 کلو)', quantity: 1, unitPrice: 1450),
            LineItem(id: 's2', description: 'دودھ (1 لیٹر)', quantity: 3, unitPrice: 220),
            LineItem(id: 's3', description: 'چینی (1 کلو)', quantity: 2, unitPrice: 160),
          ]
        : [
            LineItem(id: 's1', description: 'Flour (10 kg)', quantity: 1, unitPrice: 1450),
            LineItem(id: 's2', description: 'Milk (1 litre)', quantity: 3, unitPrice: 220),
            LineItem(id: 's3', description: 'Sugar (1 kg)', quantity: 2, unitPrice: 160),
          ],
  );
}
