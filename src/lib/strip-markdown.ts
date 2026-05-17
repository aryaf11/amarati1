/** إزالة تنسيق markdown البسيط من ردود المساعد (مثل **النص**). */
export function stripAssistantMarkdown(text: string): string {
  return text.replace(/\*\*/g, "");
}
