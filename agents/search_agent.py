import json

from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import PromptAgentDefinition, FunctionTool
from openai.types.responses.response_input_param import FunctionCallOutput

from invoice_search import search_invoices


# --------------------------------------------------
# Foundry connection
# --------------------------------------------------

PROJECT_ENDPOINT = (
    "https://invox-ai-korea-resource.services.ai.azure.com/"
    "api/projects/invox-ai-korea"
)

project_client = AIProjectClient(
    endpoint=PROJECT_ENDPOINT,
    credential=DefaultAzureCredential(),
)

openai_client = project_client.get_openai_client()


# --------------------------------------------------
# Define MongoDB search function
# --------------------------------------------------

search_invoice_tool = FunctionTool(
    name="search_invoices",
    description=(
        "Search invoice records stored in MongoDB. "
        "Use this function when the user wants to find invoices "
        "by vendor name or total amount."
    ),
    parameters={
        "type": "object",
        "properties": {
            "vendor": {
                "type": "string",
                "description": "Vendor name to search for."
            },
            "min_amount": {
                "type": "number",
                "description": "Minimum invoice total amount."
            },
            "max_amount": {
                "type": "number",
                "description": "Maximum invoice total amount."
            }
        },
        "required": [],
        "additionalProperties": False
    },
    strict=False
)


# --------------------------------------------------
# Create agent version
# --------------------------------------------------

agent = project_client.agents.create_version(
    agent_name="InvoX-Invoice-Search-Agent",
    definition=PromptAgentDefinition(
        model="gpt-5-mini",
        instructions=(
    "You are the Invoice Search and Retrieval Agent for InvoX AI. "

    "Your job is to search and retrieve invoice records "
    "from the connected MongoDB data source. "

    "Use the search_invoices function whenever the user "
    "asks to find or filter invoices. "

    "Only use invoice information returned by the function. "
    "Never invent invoice records, values, dates, vendors, "
    "amounts, or other invoice details. "

    "Keep responses concise and professional. "

    "When invoices are found, clearly show the relevant "
    "invoice number, vendor, dates, amounts, tax, and total "
    "when those fields are available. "

    "When multiple invoices are found, list each invoice "
    "separately. "

    "When no invoices are found, clearly say that no matching "
    "invoices were found. "

    "Do not offer actions that are not implemented, such as "
    "exporting invoices, retrieving files, or performing "
    "additional operations. "

    "Do not end responses with questions such as "
    "'What would you like next?' "

    "Do not make unsupported claims about fraud or wrongdoing."
),
        tools=[search_invoice_tool],
    ),
)

print(f"Agent created: {agent.name}")
print(f"Version: {agent.version}")


# --------------------------------------------------
# Create conversation
# --------------------------------------------------

conversation = openai_client.conversations.create()


# --------------------------------------------------
# Ask the agent a question
# --------------------------------------------------

response = openai_client.responses.create(
    input="Find all invoices from Acme.",
    conversation=conversation.id,
    extra_body={
        "agent_reference": {
            "name": agent.name,
            "type": "agent_reference",
        }
    },
)


# --------------------------------------------------
# Handle function calls
# --------------------------------------------------

input_list = []

for item in response.output:

    if item.type == "function_call":

        print("\nFunction requested:")
        print(item.name)

        print("Arguments:")
        print(item.arguments)

        if item.name == "search_invoices":

            arguments = json.loads(item.arguments)

            results = search_invoices(
                vendor=arguments.get("vendor"),
                min_amount=arguments.get("min_amount"),
                max_amount=arguments.get("max_amount"),
            )

            print("\nMongoDB results:")
            print(json.dumps(results, indent=2))

            input_list.append(
                FunctionCallOutput(
                    type="function_call_output",
                    call_id=item.call_id,
                    output=json.dumps(results),
                )
            )


# --------------------------------------------------
# Send function result back to the SAME conversation
# --------------------------------------------------

if input_list:

    final_response = openai_client.responses.create(
        input=input_list,
        conversation=conversation.id,
        extra_body={
            "agent_reference": {
                "name": agent.name,
                "type": "agent_reference",
            }
        },
    )

    print("\nAgent response:")
    print(final_response.output_text)

else:

    print("\nAgent response:")
    print(response.output_text)