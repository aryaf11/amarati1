/// محتوى تجريبي للمعاينة — يُستبدل لاحقاً ببيانات API.
class DemoResidentLine {
  const DemoResidentLine({required this.senderLabel, required this.body});

  final String senderLabel;
  final String body;
}

abstract final class DemoConversations {
  static const groupChatLines = <DemoResidentLine>[
    DemoResidentLine(
      senderLabel: 'سامي - 3B',
      body: 'يا جماعة فيه أحد يعرف متى بيكون اجتماع الجاي؟',
    ),
    DemoResidentLine(
      senderLabel: 'ندى - 5A',
      body: 'أعتقد يوم الجمعة الساعة 6، وصلني إشعار قبل شوي 👍',
    ),
    DemoResidentLine(
      senderLabel: 'مشعل - 4C',
      body: 'تمام، هل في موضوع معيّن بنناقشه؟',
    ),
    DemoResidentLine(
      senderLabel: 'ندى - 5A',
      body: 'صيانة المصاعد + تجديد دهانات الممرات حسب كلام المشرف',
    ),
  ];

  static const residentsLines = <DemoResidentLine>[
    DemoResidentLine(
      senderLabel: 'فهد - 2A',
      body: 'السلام عليكم، هل انقطاع الماء انحل؟',
    ),
    DemoResidentLine(
      senderLabel: 'مشرف العمارة',
      body: 'نعم، الشركة أكدت إصلاح الخزان اليوم.',
    ),
  ];

  static const announcementsLines = <DemoResidentLine>[
    DemoResidentLine(
      senderLabel: 'إدارة المبنى',
      body: 'تذكير: اجتماع السكان يوم الجمعة 6 مساءً في الصالة.',
    ),
    DemoResidentLine(
      senderLabel: 'إدارة المبنى',
      body: 'سيتم صيانة المصاعد يوم الأحد من 9 صباحاً حتى 2 ظهراً.',
    ),
  ];
}
