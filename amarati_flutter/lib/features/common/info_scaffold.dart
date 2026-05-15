import 'package:flutter/material.dart';
import 'package:amarati_flutter/l10n/app_localizations.dart';

class InfoScaffold extends StatelessWidget {
  const InfoScaffold({required this.title, super.key});

  final String title;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Text(l10n.placeholderNeedsApi),
      ),
    );
  }
}
