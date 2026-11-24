import 'package:flutter/material.dart';
import 'package:printing/printing.dart';

import '../core/constants.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../pdf/document_pdf.dart';
import 'template_grid.dart';

class PdfPane extends StatelessWidget {
  const PdfPane({super.key, required this.data, required this.kind, this.useSampleIfEmpty = true});

  final DocumentData data;
  final DocKind kind;
  final bool useSampleIfEmpty;

  @override
  Widget build(BuildContext context) {
    final preview = useSampleIfEmpty && !data.hasContent ? sampleDocument(data) : data;
    final meta = templateMeta(preview.template);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Text(
              'LIVE PREVIEW · ${meta.name.toUpperCase()}',
              style: const TextStyle(fontSize: 11, letterSpacing: 0.6, color: RaseedColors.muted, fontWeight: FontWeight.w600),
            ),
            const Spacer(),
            if (useSampleIfEmpty && !data.hasContent)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(99)),
                child: const Text('Sample data', style: TextStyle(fontSize: 11, color: Color(0xFFB45309), fontWeight: FontWeight.w600)),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: ColoredBox(
              color: const Color(0xFFF1F5F9),
              child: PdfPreview(
                build: (_) => buildDocumentPdf(preview, kind),
                canChangeOrientation: false,
                canChangePageFormat: false,
                canDebug: false,
                allowPrinting: false,
                allowSharing: false,
                pdfPreviewPageDecoration: const BoxDecoration(color: Colors.white),
                previewPageMargin: const EdgeInsets.all(16),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
