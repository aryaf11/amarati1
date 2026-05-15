import 'package:flutter/material.dart';
import 'package:amarati_flutter/l10n/app_localizations.dart';

import 'common/info_scaffold.dart';

class JoinTokenPage extends StatelessWidget {
  const JoinTokenPage({required this.token, super.key});

  final String token;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return InfoScaffold(title: '${l10n.joinWithToken}: $token');
  }
}
