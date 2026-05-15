import 'package:flutter/material.dart';
import 'package:amarati_flutter/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import '../../widgets/app_session_scope.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final session = AppSessionScope.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.login)),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l10n.placeholderNeedsApi),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () async {
                await session.setSignedIn(true);
                if (context.mounted) context.go('/dashboard');
              },
              child: Text(l10n.login),
            ),
            TextButton(
              onPressed: () => context.go('/register'),
              child: Text(l10n.register),
            ),
          ],
        ),
      ),
    );
  }
}
