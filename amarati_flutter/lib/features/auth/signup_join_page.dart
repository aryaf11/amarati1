import 'package:flutter/material.dart';
import 'package:amarati_flutter/l10n/app_localizations.dart';

import '../common/info_scaffold.dart';

class SignupJoinPage extends StatelessWidget {
  const SignupJoinPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return InfoScaffold(title: l10n.joinBuilding);
  }
}
