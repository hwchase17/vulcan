import { HumanInterrupt } from "@langchain/langgraph/prebuilt";

export function isAgentInboxInterruptSchema(
  value: unknown,
): value is HumanInterrupt[] {
  return (
    Array.isArray(value) &&
    "action_request" in value[0] &&
    typeof value[0].action_request === "object" &&
    "config" in value[0] &&
    typeof value[0].config === "object" &&
    "allow_respond" in value[0].config &&
    "allow_accept" in value[0].config &&
    "allow_edit" in value[0].config &&
    "allow_ignore" in value[0].config
  );
}
