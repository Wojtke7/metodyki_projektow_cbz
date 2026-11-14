
"""Unit tests for US-15 and US-27 response verification.

These tests use simulated AI responses.
No Gemini API calls are made.
"""

from verify_us15_us27 import check_result


def test_correct_tax_office_response():
    result = {
        "amount": "1 308,00 zł",
        "deadlines": ["7 dni od doręczenia pisma"],
        "action_checklist": [
            "Sprawdź kwotę do zapłaty.",
            "Zapłać 1 308,00 zł.",
            "Zrób to w ciągu 7 dni od doręczenia.",
        ],
    }

    assert check_result("Urząd Skarbowy", result) == []


def test_tax_office_invented_date():
    result = {
        "amount": "1 308,00 zł",
        "deadlines": ["17.11.2026"],
        "action_checklist": ["Zapłać zaległość.", "Sprawdź termin."],
    }

    assert check_result("Urząd Skarbowy", result)


def test_correct_zus_response():
    result = {
        "amount": "430,50 zł",
        "deadlines": ["30.11.2026"],
        "action_checklist": [
            "Sprawdź rachunek bankowy.",
            "Zapłać 430,50 zł do 30.11.2026.",
        ],
    }

    assert check_result("ZUS", result) == []


def test_zus_wrong_amount():
    result = {
        "amount": "500,00 zł",
        "deadlines": ["30.11.2026"],
        "action_checklist": ["Sprawdź rachunek.", "Zapłać należność."],
    }

    assert check_result("ZUS", result)


def test_bank_without_required_actions():
    result = {
        "amount": "Brak kwoty w piśmie",
        "deadlines": ["Brak terminu w piśmie"],
        "action_checklist": ["Brak wymaganych działań"],
    }

    assert check_result("Bank", result) == []


def test_bank_invented_deadline():
    result = {
        "amount": "Brak kwoty w piśmie",
        "deadlines": ["15.11.2026"],
        "action_checklist": ["Brak wymaganych działań"],
    }

    assert check_result("Bank", result)


def test_too_many_action_steps():
    result = {
        "amount": "430,50 zł",
        "deadlines": ["30.11.2026"],
        "action_checklist": [
            "Krok 1",
            "Krok 2",
            "Krok 3",
            "Krok 4",
            "Krok 5",
            "Krok 6",
        ],
    }

    assert check_result("ZUS", result)
