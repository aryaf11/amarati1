import 'package:flutter/material.dart';
import 'package:amarati_flutter/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

import '../../widgets/app_session_scope.dart';

class LandingPage extends StatelessWidget {
  const LandingPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final session = AppSessionScope.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appTitle),
        actions: [
          TextButton(
            onPressed: () => context.go('/login'),
            child: Text(l10n.login),
          ),
          TextButton(
            onPressed: () => context.go('/signup'),
            child: Text(l10n.register),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l10n.appSubtitle, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            Text(l10n.landingBody, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () {
                session.setSignedIn(true);
                context.go('/dashboard');
              },
              child: Text(l10n.dashboard),
            ),
          ],
        ),
      ),
    );
  }
}
