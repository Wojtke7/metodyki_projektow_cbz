"""Tests for masking personal identifiers before AI processing."""

from app.pii import redact_pii


def test_masks_valid_pesel_and_labeled_invalid_checksum():
    assert redact_pii("PESEL: 44051400006") == "PESEL: [PESEL]"
    assert redact_pii("PESEL: 44051400007") == "PESEL: [PESEL]"
    assert redact_pii("44051400007") == "44051400007"
    assert redact_pii("Nr PESEL: 85041200019") == "Nr PESEL: [PESEL]"


def test_masks_nip_id_card_and_passport():
    text = "NIP 8567346215, dowód ABC123456, paszport AB1234567"

    assert redact_pii(text) == (
        "NIP [NIP], dowód [ID CARD], paszport [PASSPORT]"
    )


def test_does_not_mask_phone_account_numbers_iban_or_email():
    account = "04000000000000000000000000"
    grouped_account = "04 0000 0000 0000 0000 0000 0000"
    text = (
        f"tel. +48 501 234 567, konto {account}, "
        f"konto {grouped_account}, IBAN PL{account}, a@firma.pl"
    )

    assert redact_pii(text) == text


def test_does_not_mask_invalid_account_numbers_amounts_or_dates():
    text = "Kwota 1 308,00 zł, suma 123 456 789 zł, data 21.11.2026, konto 04000000000000000000000001."

    assert redact_pii(text) == text


def test_masks_additional_presidio_entities():
    text = (
        "Karta 4111111111111111, IP 192.168.1.10, "
        "MAC 00:1A:2B:3C:4D:5E, portfel 1BoatSLRHtKNngkdXEeobR76b53LETtpyT, "
        "strona https://example.com."
    )

    assert redact_pii(text) == (
        "Karta [CREDIT CARD], IP [IP ADDRESS], "
        "MAC [MAC ADDRESS], portfel [CRYPTO], strona [URL]."
    )
