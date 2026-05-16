import 'package:flutter/material.dart';

import 'building/assistant_page.dart';

/// مساعد عام — نفس تجربة المساعد داخل المبنى (معاينة).
class ChatbotPage extends StatelessWidget {
  const ChatbotPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BuildingAssistantPage(
      buildingId: 'demo',
    );
  }
}
