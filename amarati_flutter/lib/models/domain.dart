// Domain types aligned with `prisma/schema.prisma` in the Next.js app.

typedef Id = String;

class User {
  const User({
    required this.id,
    this.email,
    required this.name,
    required this.phone,
    this.accountKind = 'RESIDENT',
    this.emailVerifiedAt,
  });

  final Id id;
  final String? email;
  final String name;
  final String phone;
  final String accountKind;
  final DateTime? emailVerifiedAt;
}

class Building {
  const Building({
    required this.id,
    required this.name,
    required this.address,
    required this.city,
    required this.inviteCode,
    required this.creatorId,
    required this.createdAt,
  });

  final Id id;
  final String name;
  final String address;
  final String city;
  final String inviteCode;
  final Id creatorId;
  final DateTime createdAt;
}

class Unit {
  const Unit({
    required this.id,
    required this.buildingId,
    required this.label,
  });

  final Id id;
  final Id buildingId;
  final String label;
}

class Membership {
  const Membership({
    required this.id,
    required this.userId,
    required this.unitId,
    required this.kind,
    this.isSupervisor = false,
  });

  final Id id;
  final Id userId;
  final Id unitId;
  final String kind;
  final bool isSupervisor;
}

class Vote {
  const Vote({
    required this.id,
    required this.buildingId,
    required this.type,
    required this.title,
    this.description,
    this.status = 'OPEN',
    required this.endsAt,
    required this.createdAt,
    this.maintenanceRequestId,
  });

  final Id id;
  final Id buildingId;
  final String type;
  final String title;
  final String? description;
  final String status;
  final DateTime endsAt;
  final DateTime createdAt;
  final Id? maintenanceRequestId;
}

class MaintenanceRequest {
  const MaintenanceRequest({
    required this.id,
    required this.buildingId,
    this.unitId,
    required this.scope,
    required this.title,
    required this.description,
    this.status = 'OPEN',
    this.aiSummary,
    this.aiSuggestions,
    required this.createdById,
    required this.createdAt,
    required this.updatedAt,
  });

  final Id id;
  final Id buildingId;
  final Id? unitId;
  final String scope;
  final String title;
  final String description;
  final String status;
  final String? aiSummary;
  final String? aiSuggestions;
  final Id createdById;
  final DateTime createdAt;
  final DateTime updatedAt;
}

class Payment {
  const Payment({
    required this.id,
    required this.userId,
    this.buildingId,
    this.maintenanceRequestId,
    required this.amountCents,
    this.currency = 'SAR',
    required this.description,
    this.status = 'PENDING',
    this.paidAt,
    required this.createdAt,
  });

  final Id id;
  final Id userId;
  final Id? buildingId;
  final Id? maintenanceRequestId;
  final int amountCents;
  final String currency;
  final String description;
  final String status;
  final DateTime? paidAt;
  final DateTime createdAt;
}

class Announcement {
  const Announcement({
    required this.id,
    required this.buildingId,
    required this.userId,
    required this.title,
    required this.body,
    required this.createdAt,
  });

  final Id id;
  final Id buildingId;
  final Id userId;
  final String title;
  final String body;
  final DateTime createdAt;
}

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.buildingId,
    required this.userId,
    required this.body,
    required this.createdAt,
  });

  final Id id;
  final Id buildingId;
  final Id userId;
  final String body;
  final DateTime createdAt;
}
