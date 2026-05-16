import 'package:flutter/material.dart';
import 'package:amarati_flutter/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

import '../../theme/chat_palette.dart';
import '../../widgets/building_conversation_header.dart';
import '../../widgets/chat_input_bar.dart';

class BuildingAssistantPage extends StatefulWidget {
  const BuildingAssistantPage({required this.buildingId, super.key});

  final String buildingId;

  @override
  State<BuildingAssistantPage> createState() => _BuildingAssistantPageState();
}

class _BuildingAssistantPageState extends State<BuildingAssistantPage> {
  final _input = TextEditingController();
  final _lines = <_AssistantLine>[];

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  void _sendUser(String text) {
    final l10n = AppLocalizations.of(context)!;
    setState(() {
      _lines.add(_AssistantLine(isUser: true, text: text));
      _lines.add(
        _AssistantLine(
          isUser: false,
          text: l10n.assistantDemoReply,
        ),
      );
    });
  }

  void _onSend() {
    final t = _input.text.trim();
    if (t.isEmpty) return;
    _input.clear();
    _sendUser(t);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final quickPrompts = [
      l10n.assistantQuickStatus,
      l10n.assistantQuickMaintenance,
      l10n.assistantQuickNextVisit,
    ];

    return Scaffold(
      backgroundColor: ChatPalette.screenBg,
      body: Column(
        children: [
          BuildingConversationHeader(
            welcomeLine: l10n.chatWelcomeUser('محمد'),
            roleLine: l10n.chatRoleOwner,
            screenTitle: l10n.assistantTitle,
            onBack: () => context.go('/building/${widget.buildingId}'),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _AssistantBubble(text: l10n.assistantWelcomeMessage),
                const SizedBox(height: 16),
                ...quickPrompts.map(
                  (q) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: SizedBox(
                      width: double.infinity,
                      child: Material(
                        color: ChatPalette.quickActionBg,
                        borderRadius: BorderRadius.circular(14),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(14),
                          onTap: () => _sendUser(q),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                            child: Text(
                              q,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 15,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                ..._lines.map(
                  (l) => Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Align(
                      alignment: l.isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.sizeOf(context).width * 0.85,
                        ),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: l.isUser ? Colors.white : ChatPalette.accentMaroon,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: const [
                            BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2)),
                          ],
                        ),
                        child: Text(
                          l.text,
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            color: l.isUser ? Colors.black87 : Colors.white,
                            height: 1.45,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          ChatInputBar(controller: _input, onSend: _onSend),
        ],
      ),
    );
  }
}

class _AssistantLine {
  const _AssistantLine({required this.isUser, required this.text});

  final bool isUser;
  final String text;
}

class _AssistantBubble extends StatelessWidget {
  const _AssistantBubble({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ChatPalette.accentMaroon,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 3)),
        ],
      ),
      child: Text(
        text,
        textAlign: TextAlign.right,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 15,
          height: 1.55,
        ),
      ),
    );
  }
}
