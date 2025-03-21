import logging
import os
from functools import lru_cache
from typing import Any, Callable, Dict, List, Optional

from langchain_core.tools import StructuredTool
from langgraph.config import get_config
from langgraph.types import interrupt
from oxp import Oxp
from oxp._exceptions import APIStatusError, OxpError
from oxp.types.tool_call_params import Request
from oxp.types.tool_call_response import ToolCallResponse
from oxp.types.tool_list_response import Item, ToolListResponse

# Set up logging
logger = logging.getLogger(__name__)

# Tool dictionaries by service
service_methods = {
    "x": [
        "X_DeleteTweetById",
        "X_LookupSingleUserByUsername",
        "X_LookupTweetById",
        "X_PostTweet",
        "X_SearchRecentTweetsByKeywords",
        "X_SearchRecentTweetsByUsername",
    ],
    "github": [
        "Github_CountStargazers",
        "Github_CreateIssue",
        "Github_CreateIssueComment",
        "Github_CreateReplyForReviewComment",
        "Github_CreateReviewComment",
        "Github_GetPullRequest",
        "Github_GetRepository",
        "Github_ListOrgRepositories",
        "Github_ListPullRequestCommits",
        "Github_ListPullRequests",
        "Github_ListRepositoryActivities",
        "Github_ListReviewCommentsInARepository",
        "Github_ListReviewCommentsOnPullRequest",
        "Github_ListStargazers",
        "Github_SetStarred",
        "Github_UpdatePullRequest",
    ],
    "gmail": [
        "Google_ListDraftEmails",
        "Google_ListEmails",
        "Google_ReplyToEmail",
        "Google_SendEmail",
        "Google_SendDraftEmail",
        "Google_WriteDraftEmail",
        "Google_WriteDraftReplyEmail",
        "Google_SearchContactsByEmail",
        "Google_SearchContactsByName",
    ],
    "google": [
        "Google_ChangeEmailLabels",
        "Google_CreateContact",
        "Google_CreateLabel",
        "Google_DeleteDraftEmail",
        "Google_GetThread",
        "Google_ListEmailsByHeader",
        "Google_ListLabels",
        "Google_ListThreads",
        "Google_SearchContactsByEmail",
        "Google_SearchContactsByName",
        "Google_SearchThreads",
        "Google_TrashEmail",
        "Google_UpdateDraftEmail",
    ],
    "gcal": [
        "Google_SearchContactsByEmail",
        "Google_SearchContactsByName",
        "Google_CreateEvent",
        "Google_ListEvents",
        "Google_UpdateEvent",
        "Google_DeleteEvent",
    ],
    "linkedin": ["Linkedin_CreateTextPost"],
    "search": [
        "Search_SearchGoogle",
    ],
    "hotels": ["Search_SearchHotels"],
    "flights": [
        "Search_SearchOneWayFlights",
        "Search_SearchRoundTripFlights",
    ],
    "stocks": ["Search_StockSummary", "Search_StockHistoricalData"],
    "codesandbox": ["CodeSandbox_RunCode"],
}


def get_oxp_client() -> Oxp:
    """Get an initialized OXP client instance.

    Returns:
        An initialized Oxp client

    Raises:
        OxpError: If required credentials are missing
    """
    try:
        # Note: The Oxp client looks for OXP_API_KEY by default
        # If you're using OXP_BEARER_TOKEN, set it explicitly
        bearer_token = os.environ.get("OXP_BEARER_TOKEN") or os.environ.get(
            "OXP_API_KEY"
        )
        base_url = os.environ.get("OXP_BASE_URL")

        client = Oxp(
            bearer_token=bearer_token,
            base_url=base_url,
        )

        # Perform a health check to verify connectivity
        client.health.check()
        return client
    except OxpError as e:
        logger.error(f"Failed to initialize OXP client: {str(e)}")
        raise


@lru_cache(maxsize=1)
def _get_available_tools() -> tuple[List[str], Dict[str, Item]]:
    """Get available tools from the OXP client with caching.

    Returns:
        A tuple of (tool_ids, available_tools_by_name)
    """
    client = get_oxp_client()
    try:
        response: ToolListResponse = client.tools.list()
        available_tools = response.items
        available_tools_by_name = {tool.name: tool for tool in available_tools}
        tool_ids = list(available_tools_by_name)
        return tool_ids, available_tools_by_name
    except APIStatusError as e:
        logger.error(f"Failed to get available tools: {str(e)}")
        raise


def _handle_authorization_error(error_body: Dict[str, Any], user_id: str) -> None:
    """Handle authorization-related errors.

    Args:
        error_body: The error body from the API
        user_id: The ID of the user making the request
    """
    if "missing_requirements" not in error_body:
        return

    missing_req = error_body["missing_requirements"]
    if "authorization" not in missing_req:
        return

    authorization = missing_req["authorization"]
    if not authorization or len(authorization) != 1:
        return

    auth = authorization[0]
    if "authorization_url" not in auth:
        return

    logger.info(f"Authorization required for user {user_id}, initiating auth flow")
    interrupt(
        [
            {
                "action_request": {
                    "action": "Auth",
                    "args": {"url": auth["authorization_url"]},
                },
                "config": {
                    "allow_ignore": False,
                    "allow_respond": False,
                    "allow_edit": False,
                    "allow_accept": True,
                },
                "description": None,
            }
        ]
    )


def create_tool_caller(tool_id: str) -> Callable[..., Any]:
    """Create a tool caller for the specified tool.

    Args:
        tool_id: The ID of the tool to call

    Returns:
        A callable function that will execute the tool with the given parameters
    """
    # We don't create a client here to avoid creating multiple clients
    # The client will be obtained when the tool is called

    def call_tool(**kwargs: Any) -> Any:
        """Call a tool with the given parameters."""
        client = get_oxp_client()
        config = get_config()
        user_id = config["configurable"].get("langgraph_auth_user_id")

        if not user_id:
            logger.error("Missing langgraph_auth_user_id in configuration")
            raise ValueError("Missing langgraph_auth_user_id in configuration")

        logger.debug(f"Calling tool {tool_id} for user {user_id} with args: {kwargs}")

        # Prepare the request according to the Oxp client's expectations
        request: Request = {
            "tool_id": tool_id,
            "context": {
                "user_id": user_id,
            },
            "input": kwargs,
        }

        try:
            # Call the tool using the client's built-in method
            response: ToolCallResponse = client.tools.call(request=request)

            # Check for successful response
            if not response.success:
                error_msg = response.error or "Unknown error occurred"
                logger.error(f"Tool call failed: {error_msg}")
                raise ValueError(f"Tool call to {tool_id} failed: {error_msg}")

            return response.value

        except APIStatusError as e:
            # Handle other API errors
            logger.error(f"API error calling tool {tool_id}: {str(e)}")
            if hasattr(e, "body"):
                _handle_authorization_error(e.body, user_id)
            raise

        except Exception as e:
            # Handle unexpected errors
            logger.exception(f"Unexpected error calling tool {tool_id}: {str(e)}")
            raise

    return call_tool


def get_tools(tool_types: Optional[List[str]] = None) -> List[StructuredTool]:
    """Get structured tools, optionally filtered by tool type.

    Args:
        tool_types: List of tool types to include (e.g., "x", "github")

    Returns:
        List of structured tools
    """
    tool_ids, available_tools_by_name = _get_available_tools()

    # Filter tool_ids by tool_types if specified
    if tool_types:
        allowed_tool_names = set()
        for t_type in tool_types:
            if t_type in service_methods:
                allowed_tool_names.update(service_methods[t_type])
            else:
                logger.warning(f"Unknown tool type: {t_type}")

        tool_ids = [t_id for t_id in tool_ids if t_id in allowed_tool_names]

        if not tool_ids:
            logger.warning(f"No tools found for the specified types: {tool_types}")

    tools = []
    for tool_id in tool_ids:
        if tool_id not in available_tools_by_name:
            logger.warning(f"Tool {tool_id} not found in available tools")
            continue

        tool = available_tools_by_name[tool_id]
        try:
            tools.append(
                StructuredTool(
                    name=tool.name,
                    description=tool.description,
                    args_schema=tool.input_schema,
                    func=create_tool_caller(tool_id),
                )
            )
        except Exception as e:
            logger.error(f"Failed to create tool for {tool_id}: {str(e)}")

    return tools
