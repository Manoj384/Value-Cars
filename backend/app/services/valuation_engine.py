from typing import Dict, Any
from datetime import datetime

# Reference baseline ex-showroom price estimates for popular Indian models (in Lakhs INR converted to Float)
BASE_PRICES_INR: Dict[str, float] = {
    "hyundai_creta": 1600000.0,
    "hyundai_venue": 1100000.0,
    "hyundai_i20": 950000.0,
    "maruti_swift": 800000.0,
    "maruti_baleno": 900000.0,
    "maruti_brezza": 1200000.0,
    "honda_city": 1400000.0,
    "honda_amaze": 850000.0,
    "tata_nexon": 1300000.0,
    "tata_harrier": 2100000.0,
    "tata_punch": 850000.0,
    "mahindra_thar": 1650000.0,
    "mahindra_xuv700": 2200000.0,
    "toyota_innova": 2400000.0,
    "toyota_fortuner": 3800000.0,
    "kia_seltos": 1600000.0,
    "kia_sonet": 1150000.0,
    "volkswagen_virtus": 1500000.0,
}

DEFAULT_BASE_PRICE = 1000000.0  # ₹10 Lakh default fallback


class ValuationEngine:
    """Intelligent Rules-based used-car valuation calculation engine."""

    @classmethod
    def calculate_valuation(
        cls,
        make: str,
        model: str,
        year: int,
        kilometers_driven: int,
        fuel_type: str = "PETROL",
        transmission: str = "MANUAL",
        ownership: str = "FIRST",
        inspection_score: float = 8.5,
    ) -> Dict[str, float]:
        """Calculates estimated market minimum, maximum, recommended buying price, and selling price."""
        current_year = datetime.now().year
        age = max(0, current_year - year)

        key = f"{make.strip().lower()}_{model.strip().lower()}"
        base_price = BASE_PRICES_INR.get(key, DEFAULT_BASE_PRICE)

        # 1. Age Depreciation (Year 1: 15%, Subsequent: 10% per year, compounding)
        depreciated_price = base_price
        for y in range(age):
            if y == 0:
                depreciated_price *= 0.85
            else:
                depreciated_price *= 0.90

        # 2. Mileage Factor (Standard ~ 12,000 km/yr. Penalty for excessive mileage)
        expected_km = (age + 1) * 12000
        km_diff = kilometers_driven - expected_km
        if km_diff > 0:
            km_penalty = min(0.20, (km_diff / 10000) * 0.02)
            depreciated_price *= (1.0 - km_penalty)
        elif km_diff < -10000:
            km_bonus = min(0.08, (abs(km_diff) / 10000) * 0.015)
            depreciated_price *= (1.0 + km_bonus)

        # 3. Ownership Factor
        ownership_multipliers = {
            "FIRST": 1.0,
            "SECOND": 0.92,
            "THIRD": 0.84,
            "FOURTH_PLUS": 0.75,
        }
        depreciated_price *= ownership_multipliers.get(ownership.upper(), 0.90)

        # 4. Transmission Bonus (Automatics retain slightly higher resale)
        if transmission.upper() == "AUTOMATIC":
            depreciated_price *= 1.04

        # 5. Inspection Score Modifier (Base line is 8.0/10)
        score_modifier = 1.0 + ((inspection_score - 8.0) * 0.03)
        final_fair_market_price = max(100000.0, depreciated_price * score_modifier)

        # Output ranges
        estimated_min = round(final_fair_market_price * 0.94, -2)
        estimated_max = round(final_fair_market_price * 1.06, -2)
        recommended_procurement = round(final_fair_market_price * 0.88, -2)  # Spinny buying price (allows ~12% gross margin & refurbishment)
        recommended_selling = round(final_fair_market_price * 1.02, -2)

        return {
            "fair_market_price": round(final_fair_market_price, -2),
            "estimated_min_price": estimated_min,
            "estimated_max_price": estimated_max,
            "recommended_procurement_price": recommended_procurement,
            "recommended_selling_price": recommended_selling,
        }
