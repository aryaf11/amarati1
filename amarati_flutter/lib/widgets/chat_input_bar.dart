import 'package:flutter/material.dart';
import 'package:amarati_flutter/l10n/app_localizations.dart';

class ChatInputBar extends StatelessWidget {
  const ChatInputBar({
    required this.controller,
    this.onSend,
    this.enabled = true,
    super.key,
  });

  final TextEditingController controller;
  final VoidCallback? onSend;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: Material(
          elevation: 2,
          shadowColor: Colors.black26,
          borderRadius: BorderRadius.circular(28),
          color: Colors.white,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(Icons.send_rounded, color: Theme.of(context).colorScheme.primary),
                  onPressed: enabled && onSend != null ? onSend : null,
                ),
                IconButton(
                  icon: Icon(Icons.mic_none_rounded, color: Colors.grey.shade600),
                  onPressed: enabled ? () {} : null,
                ),
                Expanded(
                  child: TextField(
                    controller: controller,
                    enabled: enabled,
                    textAlign: TextAlign.right,
                    decoration: InputDecoration(
                      hintText: l10n.chatTypeMessage,
                      border: InputBorder.none,
                      hintStyle: TextStyle(color: Colors.grey.shade500),
                    ),
                    onSubmitted: enabled ? (_) => onSend?.call() : null,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
