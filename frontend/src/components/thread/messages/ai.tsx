import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { MessageContentComplex } from "@langchain/core/messages";
import { parsePartialJson } from "@langchain/core/output_parsers";
import { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { Fragment } from "react/jsx-runtime";
import { BooleanParam, useQueryParam } from "use-query-params";
import { LangGraphLogoSVG } from "../../icons/langgraph";
import { ThreadView } from "../agent-inbox";
import { MarkdownText } from "../markdown-text";
import { ToolkitBadges } from "../ToolkitSelector";
import { getContentString } from "../utils";
import { BranchSwitcher, CommandBar } from "./shared";
import { ToolCalls, ToolResult } from "./tool-calls";

function CustomComponent({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const { values } = useStreamContext();
  const customComponents = values.ui?.filter(
    (ui) => ui.metadata?.message_id === message.id,
  );

  if (!customComponents?.length) return null;
  return (
    <Fragment key={message.id}>
      {customComponents.map((customComponent) => (
        <LoadExternalComponent
          key={customComponent.id}
          stream={thread}
          message={customComponent}
          meta={{ ui: customComponent }}
        />
      ))}
    </Fragment>
  );
}

function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[],
): AIMessage["tool_calls"] {
  const toolCallContents = content.filter((c) => c.type === "tool_use" && c.id);

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    if (toolCall?.input) {
      try {
        json = parsePartialJson(toolCall.input) ?? {};
      } catch {
        // Pass
      }
    }
    return {
      name: toolCall.name ?? "",
      id: toolCall.id ?? "",
      args: json,
      type: "tool_call",
    };
  });
}

export function AssistantMessage({
  message,
  isLoading,
  handleRegenerate,
}: {
  message: Message;
  isLoading: boolean;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
}) {
  const contentString = getContentString(message.content);
  const [hideToolCalls] = useQueryParam("hideToolCalls", BooleanParam);

  const thread = useStreamContext();
  const isLastMessage =
    thread.messages[thread.messages.length - 1].id === message.id;
  const meta = thread.getMessagesMetadata(message);
  const interrupt = thread.interrupt;
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  const config = meta?.firstSeenState?.values
    ? (meta.firstSeenState.values as any).config
    : undefined;
  const toolkits = config?.configurable?.tools || [];
  const anthropicStreamedToolCalls = Array.isArray(message.content)
    ? parseAnthropicStreamedToolCalls(message.content)
    : undefined;

  const hasToolCalls =
    "tool_calls" in message &&
    message.tool_calls &&
    message.tool_calls.length > 0;
  const toolCallsHaveContents =
    hasToolCalls &&
    message.tool_calls?.some(
      (tc) => tc.args && Object.keys(tc.args).length > 0,
    );
  const hasAnthropicToolCalls = !!anthropicStreamedToolCalls?.length;
  const isToolResult = message.type === "tool";

  if (isToolResult && hideToolCalls) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-4 py-3 rounded-lg bg-gray-50 relative",
        isLoading && "animate-pulse",
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <LangGraphLogoSVG width={24} height={24} />
          <span className="font-medium">Agent</span>
        </div>
        {toolkits.length > 0 && (
          <div className="ml-2">
            <ToolkitBadges toolkits={toolkits} />
          </div>
        )}
      </div>

      <div className="flex items-start mr-auto gap-2 group">
        {isToolResult ? (
          <ToolResult message={message} />
        ) : (
          <div className="flex flex-col gap-2">
            {contentString.length > 0 && (
              <div className="py-1  text-wrap">
                <MarkdownText>{contentString}</MarkdownText>
              </div>
            )}

            {!hideToolCalls && (
              <>
                {(hasToolCalls && toolCallsHaveContents && (
                  <ToolCalls toolCalls={message.tool_calls} />
                )) ||
                  (hasAnthropicToolCalls && (
                    <ToolCalls toolCalls={anthropicStreamedToolCalls} />
                  )) ||
                  (hasToolCalls && (
                    <ToolCalls toolCalls={message.tool_calls} />
                  ))}
              </>
            )}

            <CustomComponent message={message} thread={thread} />
            {isAgentInboxInterruptSchema(interrupt?.value) && isLastMessage && (
              <ThreadView interrupt={interrupt.value[0]} />
            )}
            <div
              className={cn(
                "flex gap-2 items-center mr-auto transition-opacity",
                "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
              )}
            >
              <BranchSwitcher
                branch={meta?.branch}
                branchOptions={meta?.branchOptions}
                onSelect={(branch) => thread.setBranch(branch)}
                isLoading={isLoading}
              />
              <CommandBar
                content={contentString}
                isLoading={isLoading}
                isAiMessage={true}
                handleRegenerate={() => handleRegenerate(parentCheckpoint)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AssistantMessageLoading() {
  return (
    <div className="flex items-start mr-auto gap-2">
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-2 h-8">
        <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_0.5s_infinite]"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_1s_infinite]"></div>
      </div>
    </div>
  );
}
