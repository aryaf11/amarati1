import 'package:flutter/material.dart';
import 'package:amarati_flutter/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    const demoBuildingId = 'demo';
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.dashboard),
        actions: [
          IconButton(
            tooltip: l10n.chatbot,
            onPressed: () => context.push('/chatbot'),
            icon: const Icon(Icons.smart_toy_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(l10n.placeholderNeedsApi),
          const SizedBox(height: 16),
          Card(
            child: ListTile(
              title: Text(l10n.buildingOverview),
              subtitle: Text('ID: $demoBuildingId'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.go('/building/$demoBuildingId'),
            ),
          ),
        ],
      ),
    );
  }
}
