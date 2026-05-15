import 'package:flutter/material.dart';
import 'package:amarati_flutter/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class BuildingHomePage extends StatelessWidget {
  const BuildingHomePage({required this.buildingId, super.key});

  final String buildingId;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text('${l10n.buildingOverview} · $buildingId')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(l10n.placeholderNeedsApi),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ActionChip(label: Text(l10n.maintenance), onPressed: () => context.go('/building/$buildingId/maintenance')),
              ActionChip(label: Text(l10n.votes), onPressed: () => context.go('/building/$buildingId/votes')),
              ActionChip(label: Text(l10n.payments), onPressed: () => context.go('/building/$buildingId/payments')),
              ActionChip(label: Text(l10n.chat), onPressed: () => context.go('/building/$buildingId/chat')),
              ActionChip(label: Text(l10n.announcements), onPressed: () => context.go('/building/$buildingId/announcements')),
              ActionChip(label: Text(l10n.invite), onPressed: () => context.go('/building/$buildingId/invite')),
              ActionChip(label: Text(l10n.supervisor), onPressed: () => context.go('/building/$buildingId/supervisor')),
              ActionChip(label: Text(l10n.passport), onPressed: () => context.go('/building/$buildingId/passport')),
            ],
          ),
        ],
      ),
    );
  }
}
