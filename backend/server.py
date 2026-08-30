from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Chaudhary Tiles ERP")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def today_str():
    return datetime.utcnow().strftime("%Y-%m-%d")


def new_id():
    return str(uuid.uuid4())


async def clean(doc):
    if doc and "_id" in doc:
        doc.pop("_id", None)
    return doc


# ---------------- DEFAULT SEED DATA ----------------
DEFAULT_TEAM = [
    {"name": "Mr Manoj Kumar Chaudhary", "username": "manoj", "password": "1234", "role": "Super Admin", "plant": "Both Plants", "walletLimit": 0, "permissions": {"dispatch": True, "production": True, "stock": True, "dchallan": True, "receipt": True, "expense": True, "party": True, "reports": True, "edit": True}},
    {"name": "Monu Kumar", "username": "monu", "password": "1234", "role": "Admin", "plant": "Both Plants", "walletLimit": 1500, "permissions": {"dispatch": True, "production": True, "stock": True, "dchallan": True, "receipt": True, "expense": True, "party": True, "reports": True, "edit": True}},
    {"name": "Brajesh Kumar", "username": "brajesh", "password": "1234", "role": "Manager", "plant": "Both Plants", "walletLimit": 500, "permissions": {"dispatch": True, "production": True, "stock": True, "dchallan": True, "receipt": True, "expense": True, "party": True, "reports": True, "edit": False}},
    {"name": "Jayendra Kumar", "username": "jayendra", "password": "1234", "role": "Planner", "plant": "Both Plants", "walletLimit": 500, "permissions": {"dispatch": True, "production": True, "stock": True, "dchallan": True, "receipt": False, "expense": False, "party": True, "reports": True, "edit": False}},
    {"name": "Jitendra Kumar", "username": "jitendra", "password": "1234", "role": "Optivision", "plant": "Sipara", "walletLimit": 500, "permissions": {"dispatch": True, "production": True, "stock": True, "dchallan": True, "receipt": False, "expense": False, "party": False, "reports": False, "edit": False}},
    {"name": "Mr Mani Bhushan Chaudhary", "username": "manibhushan", "password": "1234", "role": "Viewer", "plant": "Both Plants", "walletLimit": 0, "permissions": {"dispatch": False, "production": False, "stock": True, "dchallan": False, "receipt": False, "expense": False, "party": True, "reports": True, "edit": False}},
]

DEFAULT_PARTIES = [
    {"name": "Suresh Sharma", "contact": "9835012345", "address": "Sipara Bypass, Patna", "rateText": "I-Shape Red @ Rs 32/sqft", "status": "Under Working", "paymentType": "Due", "amount": 15000, "img": ""},
    {"name": "Amit Kumar", "contact": "9123456789", "address": "Kankarbagh, Patna", "rateText": "Zig-Zag 60mm Yellow @ Rs 36/sqft", "status": "Completed", "paymentType": "Due", "amount": 45000, "img": ""},
    {"name": "Vikas Singh", "contact": "9934123456", "address": "Nandlal Chhapra, Patna", "rateText": "Hexagonal Grey @ Rs 30/sqft", "status": "Under Working", "paymentType": "Advance", "amount": 20000, "img": ""},
    {"name": "Ramesh Prasad", "contact": "8877665544", "address": "Anisabad, Patna", "rateText": "3D Tile Block @ Rs 40/sqft", "status": "Pending", "paymentType": "Due", "amount": 0, "img": ""},
]

DEFAULT_CATEGORIES = [
    "Raw Material (Cement/Dust/Chips)", "Labor / Worker Payment",
    "Diesel / Fuel & Machinery", "Tea / Food / Office Misc", "Electricity / Maintenance",
]

DEFAULT_STOCK = [
    {"name": "I-Shape Paver Block (60mm)", "plant": "Sipara Plant", "unit": "Pcs", "minLimit": 10000, "colors": {"Red": 5000, "Yellow": 3000, "White": 1000, "Grey": 4000, "Black": 2000}},
    {"name": "Zebra 60mm Paver Block", "plant": "Nandlal Chhapra Plant", "unit": "Pcs", "minLimit": 12000, "colors": {"Red": 4000, "Yellow": 3000, "White": 2000, "Black": 5000}},
    {"name": "Hexagonal 60mm Paver", "plant": "Sipara Plant", "unit": "Pcs", "minLimit": 5000, "colors": {"Red": 2000, "Grey": 1500, "White": 500}},
    {"name": "PPC Cement", "plant": "Sipara Plant", "unit": "Bags", "minLimit": 100, "colors": {"General/NA": 280}},
    {"name": "OPC 53 Grade Cement", "plant": "Sipara Plant", "unit": "Bags", "minLimit": 100, "colors": {"General/NA": 150}},
    {"name": "PPC Cement", "plant": "Nandlal Chhapra Plant", "unit": "Bags", "minLimit": 100, "colors": {"General/NA": 200}},
    {"name": "OPC 53 Grade Cement", "plant": "Nandlal Chhapra Plant", "unit": "Bags", "minLimit": 100, "colors": {"General/NA": 100}},
]

DEFAULT_FIRM = {
    "name": "CHAUDHARY TILES & PAVERS", "phone": "+91 9876543210",
    "gst": "10AAAAA0000A1Z5", "address": "Sipara & Nandlal Chhapra Plant, Patna, Bihar",
}

DEFAULT_APPROVALS = [
    {"title": "Dispatch Approval (Sipara Plant)", "desc": "Request by Brajesh Kumar - 1,500 Pcs I-Shape"},
    {"title": "Expense Claim: Rs 2,500 (Diesel Limit Cross)", "desc": "Request by Jitendra Kumar"},
    {"title": "D-Challan #DC-109 Confirmation", "desc": "Request by Jayendra Kumar - Nandlal Chhapra"},
]


async def seed_if_empty():
    if await db.team.count_documents({}) == 0:
        for t in DEFAULT_TEAM:
            await db.team.insert_one({"id": new_id(), **t})
    if await db.parties.count_documents({}) == 0:
        for p in DEFAULT_PARTIES:
            await db.parties.insert_one({"id": new_id(), "date": today_str(), "dues": (p["amount"] if p["paymentType"] == "Due" else 0), **p})
    if await db.categories.count_documents({}) == 0:
        for c in DEFAULT_CATEGORIES:
            await db.categories.insert_one({"id": new_id(), "name": c})
    if await db.stock.count_documents({}) == 0:
        for s in DEFAULT_STOCK:
            await db.stock.insert_one({"id": new_id(), **s})
    if await db.firm.count_documents({}) == 0:
        await db.firm.insert_one({"id": "firm", **DEFAULT_FIRM})
    if await db.approvals.count_documents({}) == 0:
        for a in DEFAULT_APPROVALS:
            await db.approvals.insert_one({"id": new_id(), **a})
    if await db.notifications.count_documents({}) == 0:
        await db.notifications.insert_one({"id": new_id(), "title": "System Ready", "msg": "Chaudhary Tiles ERP Portal Active", "time": "Just Now", "type": "system"})
    if await db.receipts.count_documents({}) == 0:
        await db.receipts.insert_one({"id": new_id(), "srNo": "SR-1001", "date": today_str(), "party": "Suresh Sharma", "amount": 50000, "mode": "UPI / Online", "receiver": "Monu Kumar", "receiverType": "Employee", "remarks": "Advance for 60mm I-Shape"})
    if await db.expenses.count_documents({}) == 0:
        await db.expenses.insert_one({"id": new_id(), "date": today_str(), "spentBy": "Monu Kumar", "category": "Diesel / Fuel & Machinery", "amount": 2500, "remarks": "Generator Diesel", "status": "Approved", "paidTo": ""})
        await db.expenses.insert_one({"id": new_id(), "date": today_str(), "spentBy": "Brajesh Kumar", "category": "Tea / Food / Office Misc", "amount": 350, "remarks": "Tea & Snacks", "status": "Approved", "paidTo": ""})


@app.on_event("startup")
async def startup():
    await seed_if_empty()


# ---------------- AUTH ----------------
class LoginReq(BaseModel):
    userId: str
    pin: str


@api.post("/auth/login")
async def login(req: LoginReq):
    user = await db.team.find_one({"id": req.userId})
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")
    if req.pin != (user.get("password") or "1234"):
        raise HTTPException(status_code=401, detail="Invalid PIN / Password")
    return await clean(user)


# ---------------- TEAM / EMPLOYEES ----------------
class TeamIn(BaseModel):
    name: str
    username: Optional[str] = ""
    password: Optional[str] = "1234"
    role: str
    plant: str
    walletLimit: float = 0
    permissions: Dict[str, bool] = {}


@api.get("/team")
async def get_team():
    docs = await db.team.find().to_list(1000)
    return [await clean(d) for d in docs]


@api.post("/team")
async def add_team(item: TeamIn):
    doc = {"id": new_id(), **item.dict()}
    await db.team.insert_one(doc)
    return await clean(doc)


@api.put("/team/{tid}")
async def update_team(tid: str, item: TeamIn):
    await db.team.update_one({"id": tid}, {"$set": item.dict()})
    doc = await db.team.find_one({"id": tid})
    if not doc:
        raise HTTPException(404, "Not found")
    return await clean(doc)


@api.delete("/team/{tid}")
async def delete_team(tid: str):
    await db.team.delete_one({"id": tid})
    return {"ok": True}


# ---------------- PARTIES ----------------
class PartyIn(BaseModel):
    date: str
    name: str
    contact: str
    address: str
    rateText: str
    status: str
    paymentType: str
    amount: float = 0
    img: Optional[str] = ""


@api.get("/parties")
async def get_parties():
    docs = await db.parties.find().to_list(1000)
    return [await clean(d) for d in docs]


@api.post("/parties")
async def add_party(item: PartyIn):
    doc = {"id": new_id(), "dues": (item.amount if item.paymentType == "Due" else 0), **item.dict()}
    await db.parties.insert_one(doc)
    return await clean(doc)


@api.put("/parties/{pid}")
async def update_party(pid: str, item: PartyIn):
    await db.parties.update_one({"id": pid}, {"$set": {**item.dict(), "dues": (item.amount if item.paymentType == "Due" else 0)}})
    doc = await db.parties.find_one({"id": pid})
    return await clean(doc)


@api.delete("/parties/{pid}")
async def delete_party(pid: str):
    await db.parties.delete_one({"id": pid})
    return {"ok": True}


# ---------------- RECEIPTS ----------------
class ReceiptIn(BaseModel):
    date: str
    party: str
    amount: float
    mode: str
    receiverType: str
    receiver: str
    remarks: Optional[str] = ""


@api.get("/receipts")
async def get_receipts():
    docs = await db.receipts.find().to_list(2000)
    return [await clean(d) for d in docs]


@api.post("/receipts")
async def add_receipt(item: ReceiptIn):
    count = await db.receipts.count_documents({})
    sr = "SR-" + str(1001 + count)
    doc = {"id": new_id(), "srNo": sr, **item.dict()}
    await db.receipts.insert_one(doc)

    # Auto expense sync for supplier/direct
    if item.receiverType in ("Supplier / Creditor / Contractor", "Direct Expense"):
        await db.expenses.insert_one({
            "id": new_id(), "date": item.date, "spentBy": item.receiver,
            "category": item.receiver, "amount": item.amount, "remarks": f"Auto synced from Receipt ({sr}): {item.remarks}",
            "status": "Approved", "paidTo": item.party, "mode": item.mode,
        })

    # Reduce party dues
    party = await db.parties.find_one({"name": item.party})
    if party:
        new_dues = max(0, (party.get("dues") or 0) - item.amount)
        await db.parties.update_one({"id": party["id"]}, {"$set": {"dues": new_dues}})

    await db.notifications.insert_one({
        "id": new_id(), "title": "Receipt Voucher Processed",
        "msg": f"Rs {int(item.amount):,} received from {item.party} routed to {item.receiver}",
        "time": "Just Now", "type": "receipt",
    })
    return await clean(doc)


@api.put("/receipts/{rid}")
async def update_receipt(rid: str, item: ReceiptIn):
    existing = await db.receipts.find_one({"id": rid})
    if not existing:
        raise HTTPException(404, "Not found")
    await db.receipts.update_one({"id": rid}, {"$set": item.dict()})
    doc = await db.receipts.find_one({"id": rid})
    return await clean(doc)


@api.delete("/receipts/{rid}")
async def delete_receipt(rid: str):
    await db.receipts.delete_one({"id": rid})
    return {"ok": True}


# ---------------- EXPENSES ----------------
class ExpenseIn(BaseModel):
    date: str
    spentBy: str
    category: str
    amount: float
    remarks: Optional[str] = ""
    paidTo: Optional[str] = ""
    status: Optional[str] = "Approved"


@api.get("/expenses")
async def get_expenses():
    docs = await db.expenses.find().to_list(2000)
    return [await clean(d) for d in docs]


@api.post("/expenses")
async def add_expense(item: ExpenseIn):
    doc = {"id": new_id(), **item.dict()}
    await db.expenses.insert_one(doc)
    return await clean(doc)


class TransferIn(BaseModel):
    fromEmp: str
    toEmp: str
    amount: float
    note: str


@api.post("/expenses/transfer")
async def transfer(item: TransferIn):
    if item.fromEmp == item.toEmp:
        raise HTTPException(400, "Sender and Receiver cannot be the same person!")
    doc = {"id": new_id(), "date": today_str(), "spentBy": item.fromEmp,
           "category": "Wallet Fund Transfer", "amount": item.amount, "paidTo": item.toEmp,
           "remarks": item.note, "status": "Approved"}
    await db.expenses.insert_one(doc)
    return await clean(doc)


@api.put("/expenses/{eid}/status")
async def update_expense_status(eid: str, payload: Dict[str, Any]):
    await db.expenses.update_one({"id": eid}, {"$set": {"status": payload.get("status")}})
    doc = await db.expenses.find_one({"id": eid})
    return await clean(doc)


@api.delete("/expenses/{eid}")
async def delete_expense(eid: str):
    await db.expenses.delete_one({"id": eid})
    return {"ok": True}


# ---------------- CATEGORIES ----------------
@api.get("/categories")
async def get_categories():
    docs = await db.categories.find().to_list(500)
    return [await clean(d) for d in docs]


@api.post("/categories")
async def add_category(payload: Dict[str, Any]):
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(400, "Name required")
    if await db.categories.find_one({"name": name}):
        raise HTTPException(400, "This category already exists!")
    doc = {"id": new_id(), "name": name}
    await db.categories.insert_one(doc)
    return await clean(doc)


@api.delete("/categories/{cid}")
async def delete_category(cid: str):
    await db.categories.delete_one({"id": cid})
    return {"ok": True}


# ---------------- STOCK ----------------
class StockIn(BaseModel):
    name: str
    plant: str
    unit: str
    minLimit: float = 0
    colors: Dict[str, float] = {}


@api.get("/stock")
async def get_stock():
    docs = await db.stock.find().to_list(1000)
    return [await clean(d) for d in docs]


@api.post("/stock")
async def add_stock(item: StockIn):
    doc = {"id": new_id(), **item.dict()}
    await db.stock.insert_one(doc)
    return await clean(doc)


@api.delete("/stock/{sid}")
async def delete_stock(sid: str):
    await db.stock.delete_one({"id": sid})
    return {"ok": True}


class AdjustIn(BaseModel):
    itemId: str
    color: str
    action: str  # ADD or DEDUCT
    qty: float


@api.post("/stock/adjust")
async def adjust_stock(item: AdjustIn):
    doc = await db.stock.find_one({"id": item.itemId})
    if not doc:
        raise HTTPException(404, "Item not found")
    colors = doc.get("colors", {})
    cur = colors.get(item.color, 0)
    colors[item.color] = cur + item.qty if item.action == "ADD" else max(0, cur - item.qty)
    await db.stock.update_one({"id": item.itemId}, {"$set": {"colors": colors}})
    doc = await db.stock.find_one({"id": item.itemId})
    return await clean(doc)


async def apply_stock_delta(items, plant, sign):
    """sign +1 to add, -1 to subtract for produced/dispatched items."""
    for it in items:
        st = await db.stock.find_one({"id": it.get("itemId")})
        if not st:
            continue
        colors = st.get("colors", {})
        color = it.get("color")
        qty = it.get("qty", 0)
        cur = colors.get(color, 0)
        colors[color] = max(0, cur + sign * qty)
        await db.stock.update_one({"id": st["id"]}, {"$set": {"colors": colors}})


async def apply_cement_delta(plant, ppc, opc, sign):
    for name, bags in (("PPC Cement", ppc), ("OPC 53 Grade Cement", opc)):
        if bags and bags > 0:
            st = await db.stock.find_one({"name": name, "plant": plant})
            if st:
                colors = st.get("colors", {})
                cur = colors.get("General/NA", 0)
                colors["General/NA"] = max(0, cur + sign * bags)
                await db.stock.update_one({"id": st["id"]}, {"$set": {"colors": colors}})


async def add_cement_inward(plant, name, bags):
    st = await db.stock.find_one({"name": name, "plant": plant})
    if not st:
        await db.stock.insert_one({"id": new_id(), "name": name, "plant": plant, "unit": "Bags", "minLimit": 50, "colors": {"General/NA": bags}})
    else:
        colors = st.get("colors", {})
        colors["General/NA"] = colors.get("General/NA", 0) + bags
        await db.stock.update_one({"id": st["id"]}, {"$set": {"colors": colors}})


class InwardIn(BaseModel):
    plant: str
    cementName: str
    bags: float


@api.post("/stock/inward-cement")
async def inward_cement(item: InwardIn):
    await add_cement_inward(item.plant, item.cementName, item.bags)
    return {"ok": True}


# ---------------- PRODUCTION ----------------
class ProductionIn(BaseModel):
    date: str
    plant: str
    isOff: bool = False
    items: List[Dict[str, Any]] = []
    ppcBags: float = 0
    opcBags: float = 0
    createdBy: Optional[str] = ""


@api.get("/production")
async def get_production():
    docs = await db.production.find().to_list(2000)
    return [await clean(d) for d in docs]


@api.post("/production")
async def add_production(item: ProductionIn):
    doc = {"id": new_id(), "timestamp": datetime.utcnow().isoformat(), **item.dict()}
    await db.production.insert_one(doc)
    if not item.isOff:
        await apply_stock_delta(item.items, item.plant, +1)   # production adds stock
        await apply_cement_delta(item.plant, item.ppcBags, item.opcBags, -1)  # consumes cement
    return await clean(doc)


@api.put("/production/{pid}")
async def update_production(pid: str, item: ProductionIn):
    old = await db.production.find_one({"id": pid})
    if not old:
        raise HTTPException(404, "Not found")
    # revert old
    if not old.get("isOff"):
        await apply_stock_delta(old.get("items", []), old.get("plant"), -1)
        await apply_cement_delta(old.get("plant"), old.get("ppcBags", 0), old.get("opcBags", 0), +1)
    await db.production.update_one({"id": pid}, {"$set": item.dict()})
    if not item.isOff:
        await apply_stock_delta(item.items, item.plant, +1)
        await apply_cement_delta(item.plant, item.ppcBags, item.opcBags, -1)
    doc = await db.production.find_one({"id": pid})
    return await clean(doc)


@api.delete("/production/{pid}")
async def delete_production(pid: str):
    old = await db.production.find_one({"id": pid})
    if old and not old.get("isOff"):
        await apply_stock_delta(old.get("items", []), old.get("plant"), -1)
        await apply_cement_delta(old.get("plant"), old.get("ppcBags", 0), old.get("opcBags", 0), +1)
    await db.production.delete_one({"id": pid})
    return {"ok": True}


# ---------------- DISPATCHES ----------------
class DispatchIn(BaseModel):
    date: str
    plant: str
    party: str
    vehicle: str
    driver: str
    items: List[Dict[str, Any]] = []
    totalQty: float = 0
    status: str = "Pending Dispatch"
    challanNo: Optional[str] = ""
    challanImg: Optional[str] = ""


@api.get("/dispatches")
async def get_dispatches():
    docs = await db.dispatches.find().to_list(2000)
    return [await clean(d) for d in docs]


@api.post("/dispatches")
async def add_dispatch(item: DispatchIn):
    count = await db.dispatches.count_documents({})
    doc = {"id": "DISP-" + str(501 + count) + "-" + new_id()[:4], **item.dict()}
    await db.dispatches.insert_one(doc)
    return await clean(doc)


class FulfillIn(BaseModel):
    challanNo: str
    challanImg: str


@api.post("/dispatches/{did}/fulfill")
async def fulfill_dispatch(did: str, item: FulfillIn):
    d = await db.dispatches.find_one({"id": did})
    if not d:
        raise HTTPException(404, "Not found")
    await db.dispatches.update_one({"id": did}, {"$set": {"status": "Dispatched", "challanNo": item.challanNo, "challanImg": item.challanImg}})
    doc = await db.dispatches.find_one({"id": did})
    return await clean(doc)


@api.delete("/dispatches/{did}")
async def delete_dispatch(did: str):
    await db.dispatches.delete_one({"id": did})
    return {"ok": True}


# ---------------- D-CHALLANS ----------------
class ChallanIn(BaseModel):
    date: str
    dcNumber: str
    plant: str
    party: str
    siteAddr: Optional[str] = ""
    siteMobile: Optional[str] = ""
    vehicle: str
    driverName: str
    driverMobile: Optional[str] = ""
    photo: Optional[str] = ""
    items: List[Dict[str, Any]] = []
    createdBy: Optional[str] = ""


@api.get("/challans")
async def get_challans():
    docs = await db.challans.find().to_list(2000)
    return [await clean(d) for d in docs]


@api.post("/challans")
async def add_challan(item: ChallanIn):
    doc = {"id": "DC-" + new_id()[:8], **item.dict()}
    await db.challans.insert_one(doc)
    await apply_stock_delta(item.items, item.plant, -1)  # dispatch deducts stock
    return await clean(doc)


@api.put("/challans/{cid}")
async def update_challan(cid: str, item: ChallanIn):
    old = await db.challans.find_one({"id": cid})
    if not old:
        raise HTTPException(404, "Not found")
    await apply_stock_delta(old.get("items", []), old.get("plant"), +1)  # revert
    await db.challans.update_one({"id": cid}, {"$set": item.dict()})
    await apply_stock_delta(item.items, item.plant, -1)
    doc = await db.challans.find_one({"id": cid})
    return await clean(doc)


@api.delete("/challans/{cid}")
async def delete_challan(cid: str):
    old = await db.challans.find_one({"id": cid})
    if old:
        await apply_stock_delta(old.get("items", []), old.get("plant"), +1)  # restore
    await db.challans.delete_one({"id": cid})
    return {"ok": True}


# ---------------- WALLET SUMMARY ----------------
@api.get("/wallet/summary")
async def wallet_summary():
    team = await db.team.find().to_list(1000)
    receipts = await db.receipts.find().to_list(2000)
    expenses = await db.expenses.find().to_list(2000)
    result = []
    passbook = []
    for emp in team:
        credit = 0
        debit = 0
        for r in receipts:
            if r.get("receiverType") == "Employee" and r.get("receiver") == emp["name"]:
                credit += float(r.get("amount", 0))
        for e in expenses:
            approved = e.get("status", "Approved") in ("Approved", None) or not e.get("status")
            if e.get("spentBy") == emp["name"] and approved:
                debit += float(e.get("amount", 0))
            if e.get("category") == "Wallet Fund Transfer" and e.get("paidTo") == emp["name"] and approved:
                credit += float(e.get("amount", 0))
        result.append({
            "id": emp["id"], "name": emp["name"], "role": emp["role"],
            "walletLimit": emp.get("walletLimit", 0), "calculatedWallet": credit - debit,
        })
    # combined passbook
    for r in receipts:
        if r.get("receiverType") == "Employee":
            passbook.append({"date": r.get("date"), "empName": r.get("receiver"), "type": "Credit",
                             "particulars": f"Received from {r.get('party')} ({r.get('mode')}) - {r.get('srNo','')}",
                             "amount": r.get("amount"), "status": "Approved"})
    for e in expenses:
        is_transfer = e.get("category") == "Wallet Fund Transfer"
        passbook.append({"date": e.get("date"), "empName": e.get("spentBy"), "type": "Debit",
                         "particulars": f"Transfer to {e.get('paidTo')}" if is_transfer else f"Paid for {e.get('category')}",
                         "amount": e.get("amount"), "status": e.get("status", "Approved")})
        if is_transfer and e.get("paidTo"):
            passbook.append({"date": e.get("date"), "empName": e.get("paidTo"), "type": "Credit",
                             "particulars": f"Received Transfer from {e.get('spentBy')}",
                             "amount": e.get("amount"), "status": e.get("status", "Approved")})
    passbook.sort(key=lambda x: x.get("date") or "", reverse=True)
    return {"balances": result, "passbook": passbook}


# ---------------- NOTIFICATIONS ----------------
@api.get("/notifications")
async def get_notifications():
    docs = await db.notifications.find().to_list(500)
    docs.reverse()
    return [await clean(d) for d in docs]


# ---------------- APPROVALS ----------------
@api.get("/approvals")
async def get_approvals():
    docs = await db.approvals.find().to_list(100)
    return [await clean(d) for d in docs]


@api.delete("/approvals/{aid}")
async def delete_approval(aid: str):
    await db.approvals.delete_one({"id": aid})
    return {"ok": True}


# ---------------- FIRM ----------------
@api.get("/firm")
async def get_firm():
    doc = await db.firm.find_one({"id": "firm"})
    if not doc:
        return DEFAULT_FIRM
    return await clean(doc)


@api.put("/firm")
async def update_firm(payload: Dict[str, Any]):
    await db.firm.update_one({"id": "firm"}, {"$set": payload}, upsert=True)
    doc = await db.firm.find_one({"id": "firm"})
    return await clean(doc)


# ---------------- DASHBOARD ----------------
@api.get("/dashboard/summary")
async def dashboard_summary():
    t = today_str()
    receipts = await db.receipts.find({"date": t}).to_list(2000)
    expenses = await db.expenses.find({"date": t}).to_list(2000)
    dispatches = await db.dispatches.find({"date": t}).to_list(2000)
    pending = await db.approvals.count_documents({})
    return {
        "todayReceipt": sum(float(r.get("amount", 0)) for r in receipts),
        "todayExpense": sum(float(e.get("amount", 0)) for e in expenses),
        "dispatchCount": len(dispatches),
        "pendingCount": pending,
    }


# ---------------- REPORTS ----------------
@api.get("/reports")
async def reports():
    receipts = await db.receipts.find().to_list(5000)
    expenses = await db.expenses.find().to_list(5000)
    parties = await db.parties.find().to_list(2000)
    production = await db.production.find().to_list(5000)

    total_rec = sum(float(r.get("amount", 0)) for r in receipts)
    total_exp = sum(float(e.get("amount", 0)) for e in expenses)
    total_due = sum(float(p.get("dues", 0)) for p in parties)
    total_prod = 0
    for pr in production:
        for it in pr.get("items", []):
            total_prod += it.get("qty", 0)

    top_dues = sorted([p for p in parties if (p.get("dues", 0) or 0) > 0], key=lambda x: x.get("dues", 0), reverse=True)[:5]
    top_dues = [{"name": p.get("name"), "contact": p.get("contact"), "amount": p.get("amount", 0), "dues": p.get("dues", 0)} for p in top_dues]
    recent_exp = [{"category": e.get("category"), "plant": e.get("paidTo") or "-", "employee": e.get("spentBy"), "amount": e.get("amount", 0)} for e in expenses[:5]]

    return {
        "totalReceipts": total_rec, "totalExpenses": total_exp,
        "totalDues": total_due, "totalProduction": total_prod,
        "topDues": top_dues, "recentExpenses": recent_exp,
    }


# ---------------- SYSTEM ----------------
@api.get("/backup")
async def backup():
    cols = ["team", "parties", "receipts", "expenses", "categories", "stock", "production", "dispatches", "challans", "firm"]
    data = {}
    for c in cols:
        docs = await db[c].find().to_list(5000)
        data[c] = [await clean(d) for d in docs]
    data["exportDate"] = datetime.utcnow().isoformat()
    return data


@api.post("/system/reset")
async def reset_system():
    for c in ["team", "parties", "receipts", "expenses", "categories", "stock", "production", "dispatches", "challans", "firm", "approvals", "notifications"]:
        await db[c].delete_many({})
    await seed_if_empty()
    return {"ok": True}


@api.get("/")
async def root():
    return {"message": "Chaudhary Tiles ERP API"}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
