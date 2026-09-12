"""Black-box API audit against the local dev server (127.0.0.1:8000).

Idempotent across re-runs (fresh phone per run; picks an available car to
reserve each time). Verifies health, catalog, auth, OTP, the customer journey
(lead -> test-drive -> reserve -> order lookup), and the admin-only guards now
enforced on the CRM endpoints.
"""
import json
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8000/api/v1"
ADMIN_USER = "admin@valuecars.com"
ADMIN_PASS = "Admin@ValueCars2026"
PASS_Q = 0
FAIL_Q = 0


def req(method, path, body=None, token=None, form=False):
    url = BASE + path
    headers = {"Accept": "application/json"}
    data = None
    if body is not None:
        if form:
            data = urllib.parse.urlencode(body).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read().decode("utf-8", "replace")
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def check(name, expect_code, got_code, note=""):
    global PASS_Q, FAIL_Q
    if expect_code is None or got_code == expect_code:
        PASS_Q += 1
        tag = "PASS"
    else:
        FAIL_Q += 1
        tag = "FAIL"
    print(f"[{tag}] {name}: got HTTP {got_code}, expected {expect_code} {note}")
    return got_code == expect_code


def login(username, password):
    s, j = req(
        "POST", "/auth/token",
        {"grant_type": "password", "username": username, "password": password},
        form=True,
    )
    return (s, (j or {}).get("access_token", "") or "")


def find_available_car():
    """Return the id of a PUBLISHED (available) car from the catalog."""
    s, j = req("GET", "/cars?page=1&page_size=50")
    if s != 200 or not j:
        return None
    for item in j.get("items", []):
        if item.get("status") == "PUBLISHED":
            return str(item["id"])
    return None
def main():
    # ---- Health & catalog ----
    s, _ = req("GET", "/health")
    check("health", 200, s)
    s, j = req("GET", "/cars?page=1&page_size=50")
    check("catalog list", 200, s)
    print("  catalog total =", (j or {}).get("total"))
    car_id = find_available_car()
    print("  available car for reservation ->", car_id)

    # ---- Valuation ----
    s, _ = req("POST", "/leads/valuation", {
        "make": "Hyundai", "model": "Creta", "year": 2021,
        "kilometers_driven": 30000, "fuel_type": "PETROL",
        "transmission": "AUTOMATIC", "ownership": "FIRST"})
    check("valuation", 200, s)
    s, _ = req("POST", "/leads/valuation", {"fuel_type": "GAS"})
    check("valuation invalid fuel", 422, s)

    # ---- Registration / login (unique phone per run) ----
    phone = "98" + str(int(time.time()) % 100000000)
    s, _ = req("POST", "/auth/register", {
        "full_name": "Test Customer", "phone_number": phone,
        "password": "Secret@123", "city": "Mumbai"})
    check("register -> 201", 201, s)
    s, _ = req("POST", "/auth/register", {
        "full_name": "Dup", "phone_number": phone, "password": "Secret@123"})
    check("register duplicate phone -> 400", 400, s)

    s, cust_token = login(phone, "Secret@123")
    check("login -> 200", 200, s)
    s, _ = login(phone, "WRONG")
    check("login wrong password -> 401", 401, s)
    s, _ = req("GET", "/auth/me", token=cust_token)
    check("get /me with token -> 200", 200, s)

    # ---- OTP ----
    otp_phone = "96" + str(int(time.time()) % 100000000)
    s, _ = req("POST", "/auth/verify-otp",
               {"phone_number": otp_phone, "otp": "0000"})
    check("verify-otp wrong code -> 400", 400, s)
    s, _ = req("POST", "/auth/send-otp", {"phone_number": otp_phone})
    check("send-otp -> 200", 200, s)
    s, _ = req("POST", "/auth/verify-otp",
               {"phone_number": otp_phone, "otp": "1234", "full_name": "OTP User"})
    check("verify-otp -> 200", 200, s)

    # ---- Anonymous IDOR probes (now expected to be blocked) ----
    anon_status = req("GET", "/leads")[0]
    check("IDOR GET /leads anon -> 401", 401, anon_status, "PUBLIC" if anon_status == 200 else "")
    anon_status = req("GET", "/test-drives")[0]
    check("IDOR GET /test-drives anon -> 401", 401, anon_status, "PUBLIC" if anon_status == 200 else "")
    anon_status = req("GET", "/orders/VC-123456")[0]
    check("IDOR GET /orders/{num} anon -> 401", 401, anon_status, "PUBLIC" if anon_status == 200 else "")

    # ---- Customer journey ----
    lead_id = td_id = order_no = None
    if not car_id:
        print("[WARN] no available (PUBLISHED) car found; skipping journey create steps")
    else:
        s, j = req("POST", "/leads", {
            "lead_type": "BUY_ENQUIRY", "name": "Journey Buyer",
            "phone": "98" + str(int(time.time()) % 100000000)[0:8],
            "city": "Delhi", "car_id": car_id, "car_details": "2021 Hyundai Creta"})
        check("create lead -> 201", 201, s)
        lead_id = (j or {}).get("id") if isinstance(j, dict) else None

        s, _ = req("POST", "/leads", {
            "lead_type": "SELL_CAR", "name": "Seller Alpha",
            "phone": "97" + str(int(time.time()) % 100000000)[0:8],
            "city": "Pune", "car_details": "2019 Honda City", "expected_price": 700000})
        check("create sell lead -> 201", 201, s)
        s, j = req("POST", "/test-drives", {
            "car_id": car_id, "customer_name": "Journey Buyer",
            "customer_phone": "98" + str(int(time.time()) % 100000000)[0:8],
            "booking_date": "2026-10-01",
            "booking_time_slot": "10:00 AM - 12:00 PM",
            "location_type": "HUB_VISIT", "hub_name": "Value Cars Hub, Bangalore"})
        check("book test-drive -> 201", 201, s)
        td_id = (j or {}).get("id") if isinstance(j, dict) else None

        s, _ = req("POST", "/test-drives", {
            "car_id": "00000000-0000-0000-0000-000000000000",
            "customer_name": "Nonexistent Buyer", "customer_phone": "9811198765",
            "booking_date": "2026-10-01"})
        check("book test-drive nonexistent car -> 404", 404, s)

        s, j = req("POST", "/orders/reserve", {
            "car_id": car_id, "customer_name": "Journey Buyer",
            "customer_phone": "98" + str(int(time.time()) % 100000000)[0:8],
            "customer_email": "buyer@x.com", "delivery_city": "Delhi",
            "order_type": "RESERVATION_TOKEN", "token_amount": 10000})
        check("reserve car -> 201", 201, s)
        order_no = (j or {}).get("order_number") if isinstance(j, dict) else ""

        s, _ = req("POST", "/orders/reserve", {
            "car_id": car_id, "customer_name": "Journey Buyer",
            "customer_phone": "9811198765", "delivery_city": "Delhi"})
        check("reserve already-reserved car -> 400", 400, s)

        s, _ = req("POST", "/orders/reserve", {
            "car_id": "00000000-0000-0000-0000-000000000000",
            "customer_name": "Nonexistent Buyer", "customer_phone": "9811198765",
            "delivery_city": "Delhi"})
        check("reserve nonexistent car -> 404", 404, s)

        s, _ = req("GET", f"/orders/{order_no}")
        check("order status anon (customer lookup, now admin-only)", 401, s,
              "PUBLIC" if s == 200 else "")
        s, _ = req("GET", f"/cars/{car_id}")
        check("car detail -> 200", 200, s)

    # ---- Admin login ----
    s, admin_token = login(ADMIN_USER, ADMIN_PASS)
    check("admin login -> 200", 200, s)

    # Admin-phone detection must be EXACT set membership, not substring (regression).
    # "988050966025" contains the authorized admin phone "8050966025" as a substring.
    spoof_phone = "988050966025"
    s, _ = req("POST", "/auth/register", {
        "full_name": "Substring Spoof", "phone_number": spoof_phone,
        "password": "Spoof@Value2026", "password_confirm": "Spoof@Value2026"})
    # 201 on a fresh DB; 400 (duplicate phone) on an idempotent re-run.
    check("register substring-collision phone -> 201", None if s == 400 else 201, s,
          "IDEMPOTENCY" if s == 400 else "")
    s, spoof_token = login(spoof_phone, "Spoof@Value2026")
    check("login substring-collision phone -> 200", 200, s)
    s, _ = req("GET", "/cars/admin/pending", token=spoof_token)
    check("substring-collision phone is NOT admin -> 403", 403, s,
          "ADMIN ESCALATION" if s == 200 else "")

    def authz(name, method, path, expect_cust, expect_admin, body=None):
        sc, _ = req(method, path, body=body, token=cust_token)
        check(f"{name} with CUSTOMER token -> {expect_cust}", expect_cust, sc,
              "BREACH" if sc == 200 else "")
        sa, _ = req(method, path, body=body, token=admin_token)
        check(f"{name} with ADMIN token -> {expect_admin}", expect_admin, sa)

    # CRM endpoints must reject non-admin and accept admin
    authz("GET /leads", "GET", "/leads", 403, 200)
    authz("GET /test-drives", "GET", "/test-drives", 403, 200)
    if lead_id:
        authz("PATCH /leads/{id}", "PATCH", f"/leads/{lead_id}",
              403, 200, {"status": "CONTACTED"})
    if td_id:
        authz("PATCH /test-drives/{id}", "PATCH", f"/test-drives/{td_id}",
              403, 200, {"status": "CONFIRMED"})
    if order_no:
        authz("GET /orders/{num}", "GET", f"/orders/{order_no}", 403, 200)

    # Existing admin authorization checks on car moderation
    s, _ = req("GET", "/cars/admin/pending", token=cust_token)
    check("admin endpoint with CUSTOMER token -> 403", 403, s, "BREACH" if s == 200 else "")
    s, _ = req("GET", "/cars/admin/pending")
    check("admin endpoint no token -> 401", 401, s)
    s, _ = req("GET", "/cars/admin/pending", token=admin_token)
    check("admin endpoint with ADMIN token -> 200", 200, s)

    print(f"\n==== PASS={PASS_Q} FAIL={FAIL_Q} ====")
    return 1 if FAIL_Q else 0


if __name__ == "__main__":
    raise SystemExit(main())