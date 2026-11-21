"""Tests for masking personal identifiers before AI processing."""

from app.pii import redact_pii


def test_masks_valid_pesel_and_leaves_invalid_checksum_unchanged():
    assert redact_pii("PESEL: 44051400006") == "PESEL: [PESEL]"
    assert redact_pii("PESEL: 44051400007") == "PESEL: 44051400007"


def test_masks_nip_id_card_passport_phone_and_email():
    text = "NIP 8567346215, dowód ABC123456, paszport AB1234567, tel. +48 501 234 567, a@firma.pl"

    assert redact_pii(text) == (
        "NIP [NIP], dowód [ID CARD], paszport [PASSPORT], "
        "tel. [PHONE], [EMAIL]"
    )


def test_masks_polish_account_number_formats_and_iban():
    account = "04000000000000000000000000"
    grouped_account = "04 0000 0000 0000 0000 0000 0000"

    assert redact_pii(f"Rachunki: {account} i {grouped_account}.") == (
        "Rachunki: [ACCOUNT] i [ACCOUNT]."
    )
    assert redact_pii(f"IBAN PL{account}") == "IBAN [IBAN]"
    assert redact_pii("IBAN GB82 WEST 1234 5698 7654 32") == "IBAN [IBAN]"


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
