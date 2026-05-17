export type ChatLine = {
  senderLabel: string;
  body: string;
  isOwn?: boolean;
};

export type ResidentRow = {
  name: string;
  unitLabel: string;
  roleLabel: string;
};
