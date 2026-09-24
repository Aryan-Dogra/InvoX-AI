import os

from pymongo import MongoClient
from bson import ObjectId


MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = "invox-ai"


def search_invoices(
    vendor=None,
    min_amount=None,
    max_amount=None,
    user_id=None
):
    if not MONGO_URI:
        raise RuntimeError(
            "MONGODB_URI environment variable is not set"
        )

    client = MongoClient(MONGO_URI)

    try:
        db = client[DB_NAME]
        invoices = db["invoices"]

        # Temporary debugging
        print(
            "Python MongoDB database:",
            db.name
        )

        print(
            "Python invoice count:",
            invoices.count_documents({})
        )

        print(
            "Python invoice sample:",
            invoices.find_one(
                {},
                {
                    "vendorName": 1,
                    "userId": 1,
                    "invoiceNumber": 1
                }
            )
        )

        query = {}

        # --------------------------------------------------
        # Restrict search to the logged-in user's invoices
        # --------------------------------------------------
        if user_id:
            try:
                query["userId"] = ObjectId(user_id)
            except Exception:
                return []

        # --------------------------------------------------
        # Search by vendor name
        # --------------------------------------------------
        if vendor:
            query["vendorName"] = {
                "$regex": vendor,
                "$options": "i"
            }

        # --------------------------------------------------
        # Search by total amount
        # --------------------------------------------------
        if min_amount is not None or max_amount is not None:
            query["total"] = {}

            if min_amount is not None:
                query["total"]["$gte"] = min_amount

            if max_amount is not None:
                query["total"]["$lte"] = max_amount

        # --------------------------------------------------
        # Search MongoDB
        # --------------------------------------------------
        results = list(
            invoices.find(
                query,
                {
                    "_id": 0,
                    "invoiceNumber": 1,
                    "vendorName": 1,
                    "invoiceDate": 1,
                    "dueDate": 1,
                    "subtotal": 1,
                    "tax": 1,
                    "total": 1,
                    "currency": 1,
                }
            )
        )

        # --------------------------------------------------
        # Convert MongoDB dates to JSON-safe strings
        # --------------------------------------------------
        for invoice in results:

            if invoice.get("invoiceDate"):
                invoice["invoiceDate"] = (
                    invoice["invoiceDate"].isoformat()
                )

            if invoice.get("dueDate"):
                invoice["dueDate"] = (
                    invoice["dueDate"].isoformat()
                )

        return results

    finally:
        client.close()


# ---------------------------------------------------------
# Local testing
# ---------------------------------------------------------

if __name__ == "__main__":

    results = search_invoices(
        vendor="Acme"
    )

    print(
        f"Found {len(results)} invoice(s)"
    )

    for invoice in results:
        print(invoice)