import 'package:flutter/material.dart';
import 'package:amarati_flutter/l10n/app_localizations.dart';

import '../common/info_scaffold.dart';

class AnnouncementsPage extends StatelessWidget {
  const AnnouncementsPage({required this.buildingId, super.key});

  final String buildingId;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return InfoScaffold(title: '${l10n.announcements} · $buildingId');
  }
}
