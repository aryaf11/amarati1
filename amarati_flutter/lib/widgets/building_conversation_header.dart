import 'package:flutter/material.dart';

/// رأس شاشات المحادثة: ترحيب + الدور + عنوان الشاشة + رجوع.
class BuildingConversationHeader extends StatelessWidget {
  const BuildingConversationHeader({
    required this.welcomeLine,
    required this.roleLine,
    required this.screenTitle,
    this.onBack,
    super.key,
  });

  final String welcomeLine;
  final String roleLine;
  final String screenTitle;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left, size: 32),
            onPressed: onBack ?? () => Navigator.maybePop(context),
            tooltip: MaterialLocalizations.of(context).backButtonTooltip,
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  welcomeLine,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                  textAlign: TextAlign.right,
                ),
                Text(
                  roleLine,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                  textAlign: TextAlign.right,
                ),
                const SizedBox(height: 4),
                Text(
                  screenTitle,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                  textAlign: TextAlign.right,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
