"""Presidio recognizers and anonymization for Polish document identifiers."""

import re
from collections.abc import Callable

from presidio_analyzer import AnalyzerEngine, Pattern, PatternRecognizer, RecognizerRegistry
from presidio_analyzer.context_aware_enhancers.context_aware_enhancer import ContextAwareEnhancer
from presidio_analyzer.entity_recognizer import EntityRecognizer
from presidio_analyzer.nlp_engine import NlpArtifacts, NoOpNlpEngine
from presidio_analyzer.recognizer_result import RecognizerResult
from presidio_analyzer.predefined_recognizers.generic import (
    CreditCardRecognizer,
    CryptoRecognizer,
    IpRecognizer,
    MacAddressRecognizer,
    UrlRecognizer,
)
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

_PESEL_PATTERN = r"(?<![A-Za-z0-9])[0-9](?:[ -]?[0-9]){10}(?![A-Za-z0-9])"
_NIP_PATTERN = r"(?<![A-Za-z0-9])[0-9](?:[ -]?[0-9]){9}(?![A-Za-z0-9])"
_ACCOUNT_PATTERN = r"(?<![A-Za-z0-9])[0-9](?:[ ]?[0-9]){25}(?![A-Za-z0-9])"
_IBAN_PATTERN = (
    r"(?<![A-Za-z0-9])[A-Z]{2}[0-9]{2}(?:[ ]?[A-Z0-9]){11,30}(?![A-Za-z0-9])"
)
_EMAIL_PATTERN = (
    r"(?<![A-Za-z0-9.!#$%&'*+/=?^_`{|}~-])"
    r"[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@"
    r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?"
    r"(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+"
)
_ID_CARD_PATTERN = r"(?<![A-Za-z0-9])[A-Z]{3}[0-9]{6}(?![A-Za-z0-9])"
_PASSPORT_PATTERN = r"(?<![A-Za-z0-9])[A-Z]{2}[0-9]{7}(?![A-Za-z0-9])"
_PHONE_PATTERN = r"(?<![A-Za-z0-9])(?:\+?48[ -]?)?(?:[0-9][ -]?){8}[0-9](?![A-Za-z0-9])"
_CURRENCY_CONTEXT = re.compile(r"(?:zł|pln|eur|usd|gbp|€|\$|£)", re.IGNORECASE)

_PLACEHOLDERS = {
    "PESEL": "[PESEL]",
    "NIP": "[NIP]",
    "ID_CARD": "[ID CARD]",
    "PASSPORT": "[PASSPORT]",
    "IBAN": "[IBAN]",
    "ACCOUNT": "[ACCOUNT]",
    "PHONE": "[PHONE]",
    "EMAIL": "[EMAIL]",
    "CREDIT_CARD": "[CREDIT CARD]",
    "IP_ADDRESS": "[IP ADDRESS]",
    "MAC_ADDRESS": "[MAC ADDRESS]",
    "CRYPTO": "[CRYPTO]",
    "URL": "[URL]",
}


def _digits(value: str) -> str:
    return re.sub(r"\D", "", value)


def _is_pesel(value: str) -> bool:
    digits = _digits(value)
    if len(digits) != 11:
        return False
    weights = (1, 3, 7, 9, 1, 3, 7, 9, 1, 3)
    checksum = sum(int(digit) * weight for digit, weight in zip(digits[:10], weights))
    return (10 - checksum % 10) % 10 == int(digits[10])


def _is_nip(value: str) -> bool:
    digits = _digits(value)
    if len(digits) != 10:
        return False
    weights = (6, 5, 7, 2, 3, 4, 5, 6, 7)
    checksum = sum(int(digit) * weight for digit, weight in zip(digits[:9], weights)) % 11
    return checksum != 10 and checksum == int(digits[9])


def _mod97(value: str) -> int:
    remainder = 0
    for character in value:
        digit_value = int(character) if character.isdigit() else ord(character) - ord("A") + 10
        for digit in str(digit_value):
            remainder = (remainder * 10 + int(digit)) % 97
    return remainder


def _is_iban(value: str) -> bool:
    iban = re.sub(r"\s", "", value).upper()
    return 15 <= len(iban) <= 34 and _mod97(iban[4:] + iban[:4]) == 1


def _is_polish_account(value: str) -> bool:
    digits = _digits(value)
    return len(digits) == 26 and _mod97(digits[2:] + "2521" + digits[:2]) == 1


def _phone_not_amount(text: str, start: int, end: int) -> bool:
    context = text[max(0, start - 6) : min(len(text), end + 8)]
    return _CURRENCY_CONTEXT.search(context) is None


class _PolishPatternRecognizer(PatternRecognizer):
    def __init__(
        self,
        entity: str,
        pattern: str,
        validator: Callable[[str], bool] | None = None,
        span_validator: Callable[[str, int, int], bool] | None = None,
    ) -> None:
        self._validator = validator
        self._span_validator = span_validator
        super().__init__(
            supported_entity=entity,
            supported_language="pl",
            patterns=[Pattern(name=f"{entity.lower()}_pattern", regex=pattern, score=1.0)],
        )

    def validate_result(self, pattern_text: str) -> bool | None:
        if self._validator is None:
            return None
        return self._validator(pattern_text)

    def analyze(
        self,
        text: str,
        entities: list[str],
        nlp_artifacts: NlpArtifacts | None = None,
        regex_flags: int | None = None,
    ) -> list[RecognizerResult]:
        results = super().analyze(text, entities, nlp_artifacts, regex_flags)
        if self._span_validator is None:
            return results
        return [
            result
            for result in results
            if self._span_validator(text, result.start, result.end)
        ]


def _create_analyzer() -> AnalyzerEngine:
    recognizers = [
        _PolishPatternRecognizer("PESEL", _PESEL_PATTERN, validator=_is_pesel),
        _PolishPatternRecognizer("NIP", _NIP_PATTERN, validator=_is_nip),
        _PolishPatternRecognizer("ID_CARD", _ID_CARD_PATTERN),
        _PolishPatternRecognizer("PASSPORT", _PASSPORT_PATTERN),
        _PolishPatternRecognizer("IBAN", _IBAN_PATTERN, validator=_is_iban),
        _PolishPatternRecognizer("ACCOUNT", _ACCOUNT_PATTERN, validator=_is_polish_account),
        _PolishPatternRecognizer(
            "PHONE",
            _PHONE_PATTERN,
            span_validator=_phone_not_amount,
        ),
        _PolishPatternRecognizer("EMAIL", _EMAIL_PATTERN),
        CreditCardRecognizer(supported_language="pl"),
        IpRecognizer(supported_language="pl"),
        MacAddressRecognizer(supported_language="pl"),
        CryptoRecognizer(supported_language="pl"),
        UrlRecognizer(supported_language="pl"),
    ]
    registry = RecognizerRegistry(recognizers=recognizers, supported_languages=["pl"])
    nlp_engine = NoOpNlpEngine(models=[{"lang_code": "pl", "model_name": "no_op"}])
    return AnalyzerEngine(
        registry=registry,
        nlp_engine=nlp_engine,
        supported_languages=["pl"],
        context_aware_enhancer=_NoContextEnhancer(),
    )


class _NoContextEnhancer(ContextAwareEnhancer):
    def __init__(self) -> None:
        super().__init__(
            context_similarity_factor=0,
            min_score_with_context_similarity=0,
            context_prefix_count=0,
            context_suffix_count=0,
        )

    def enhance_using_context(
        self,
        text: str,
        raw_results: list[RecognizerResult],
        nlp_artifacts: NlpArtifacts,
        recognizers: list[EntityRecognizer],
        context: list[str] | None = None,
    ) -> list[RecognizerResult]:
        return raw_results


_ANALYZER = _create_analyzer()
_ANONYMIZER = AnonymizerEngine()
_OPERATORS = {
    entity: OperatorConfig("replace", {"new_value": placeholder})
    for entity, placeholder in _PLACEHOLDERS.items()
}


def redact_pii(text: str) -> str:
    """Detect supported identifiers with Presidio and replace them with placeholders."""
    results = _ANALYZER.analyze(
        text=text,
        entities=list(_PLACEHOLDERS),
        language="pl",
    )
    return _ANONYMIZER.anonymize(
        text=text,
        analyzer_results=results,
        operators=_OPERATORS,
    ).text
