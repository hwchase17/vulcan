import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string, accessToken?: string) {
  const headers: Record<string, string> = {};
  
  if (!apiUrl) {
    console.error("[createClient] No API URL provided");
    throw new Error("API URL is required to create a client");
  }
  
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else {
    console.warn("[createClient] No access token provided - authentication may fail");
  }

  try {
    return new Client({
      apiUrl,
      defaultHeaders: headers,
    });
  } catch (error) {
    console.error("[createClient] Error creating LangGraph client:", error);
    throw error;
  }
}
