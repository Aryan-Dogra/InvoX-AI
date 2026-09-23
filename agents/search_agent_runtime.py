import sys
import json

from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from openai.types.responses.response_input_param import FunctionCallOutput

from invoice_search import search_invoices


PROJECT_ENDPOINT = (
    "https://invox-ai-korea-resource.services.ai.azure.com/"
    "api/projects/invox-ai-korea"
)

AGENT_NAME = "InvoX-Invoice-Search-Agent"


def ask_agent(question, user_id=None):
    project_client = AIProjectClient(
        endpoint=PROJECT_ENDPOINT,
        credential=DefaultAzureCredential(),
    )

    openai_client = project_client.get_openai_client()

    # Create a conversation for this request
    conversation = openai_client.conversations.create()

    # Ask the existing Search Agent
    response = openai_client.responses.create(
        input=question,
        conversation=conversation.id,
        extra_body={
            "agent_reference": {
                "name": AGENT_NAME,
                "type": "agent_reference",
            }
        },
    )

    input_list = []

    # Handle function calls
    for item in response.output:

        if item.type == "function_call":

            if item.name == "search_invoices":

                arguments = json.loads(item.arguments)

                results = search_invoices(
                    vendor=arguments.get("vendor"),
                    min_amount=arguments.get("min_amount"),
                    max_amount=arguments.get("max_amount"),
                    user_id=user_id,
                )

                input_list.append(
                    FunctionCallOutput(
                        type="function_call_output",
                        call_id=item.call_id,
                        output=json.dumps(results),
                    )
                )

    # If the agent didn't need the database function
    if not input_list:
        return response.output_text

    # Send MongoDB results back to Foundry
    final_response = openai_client.responses.create(
        input=input_list,
        conversation=conversation.id,
        extra_body={
            "agent_reference": {
                "name": AGENT_NAME,
                "type": "agent_reference",
            }
        },
    )

    return final_response.output_text


if __name__ == "__main__":

    if len(sys.argv) < 2:
        print(
            json.dumps({
                "success": False,
                "message": "No question provided"
            })
        )
        sys.exit(1)

    question = sys.argv[1]

    user_id = None

    if len(sys.argv) >= 3:
        user_id = sys.argv[2]

    try:
        answer = ask_agent(
            question,
            user_id=user_id
        )

        print(
            json.dumps({
                "success": True,
                "answer": answer
            })
        )

    except Exception as error:

        print(
            json.dumps({
                "success": False,
                "message": str(error)
            })
        )

        sys.exit(1)