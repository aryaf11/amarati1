import 'package:flutter/material.dart';
import 'package:amarati_flutter/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

import '../../data/demo_conversations.dart';
import '../../theme/chat_palette.dart';
import '../../widgets/building_conversation_header.dart';
import '../../widgets/chat_input_bar.dart';

class BuildingChatPage extends StatefulWidget {
  const BuildingChatPage({required this.buildingId, super.key});

  final String buildingId;

  @override
  State<BuildingChatPage> createState() => _BuildingChatPageState();
}

class _BuildingChatPageState extends State<BuildingChatPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  final _input = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this, initialIndex: 2);
  }

  @override
  void dispose() {
    _tabs.dispose();
    _input.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: ChatPalette.screenBg,
      body: Column(
        children: [
          BuildingConversationHeader(
            welcomeLine: l10n.chatWelcomeUser('محمد'),
            roleLine: l10n.chatRoleOwner,
            screenTitle: l10n.conversationsTitle,
            onBack: () => context.go('/building/${widget.buildingId}'),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: TabBar(
              controller: _tabs,
              indicator: BoxDecoration(
                color: ChatPalette.accentMaroon,
                borderRadius: BorderRadius.circular(12),
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.black87,
              dividerColor: Colors.transparent,
              labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              tabs: [
                Tab(text: l10n.chatTabResidents),
                Tab(text: l10n.chatTabAnnouncements),
                Tab(text: l10n.chatTabGroup),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: [
                _MessageList(
                  lines: DemoConversations.residentsLines,
                  pinnedText: null,
                ),
                _MessageList(
                  lines: DemoConversations.announcementsLines,
                  pinnedText: null,
                ),
                _MessageList(
                  lines: DemoConversations.groupChatLines,
                  pinnedText: l10n.chatGroupPinnedHint,
                ),
              ],
            ),
          ),
          ChatInputBar(
            controller: _input,
            onSend: () {
              final t = _input.text.trim();
              if (t.isEmpty) return;
              _input.clear();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(l10n.chatSendDemoOnly)),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _MessageList extends StatelessWidget {
  const _MessageList({required this.lines, this.pinnedText});

  final List<DemoResidentLine> lines;
  final String? pinnedText;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      itemCount: lines.length + (pinnedText != null ? 1 : 0),
      itemBuilder: (context, index) {
        if (pinnedText != null && index == lines.length) {
          return Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
              decoration: BoxDecoration(
                color: ChatPalette.accentMaroon,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                pinnedText!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
          );
        }
        final line = lines[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                line.senderLabel,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 6),
              Align(
                alignment: Alignment.centerRight,
                child: Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.sizeOf(context).width * 0.88,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: ChatPalette.bubbleResident,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    line.body,
                    textAlign: TextAlign.right,
                    style: const TextStyle(color: Colors.white, height: 1.45, fontSize: 15),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
