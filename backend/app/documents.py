"""Text extraction for temporary document uploads."""

from io import BytesIO
import zipfile

import fitz
from docx import Document
from docx.blkcntnr import BlockItemContainer
from docx.opc.exceptions import PackageNotFoundError
from docx.table import Table
from docx.text.paragraph import Paragraph
from lxml.etree import XMLSyntaxError


class DocumentTypeError(ValueError):
    """The uploaded content is not a supported document type."""


class DocumentTooLargeError(ValueError):
    """The uploaded document exceeds a processing limit."""


class NoDocumentTextError(ValueError):
    """The document does not contain extractable text."""


MAX_UPLOAD_SIZE_MB = 10
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
MAX_DOCX_UNCOMPRESSED_SIZE_BYTES = 50 * 1024 * 1024

_PDF_SIGNATURE = b"%PDF-"
_ZIP_SIGNATURE = b"PK\x03\x04"
_DOCX_REQUIRED_FILES = {"[Content_Types].xml", "word/document.xml"}
_TEXT_CONTROL_BYTES = set(range(32)) - {9, 10, 12, 13}


def extract_document_text(data: bytes) -> str:
    """Detect a supported format from its content and extract its text."""
    if "pdf" in DOCUMENT_EXTRACTORS and _PDF_SIGNATURE in data[:1024]:
        extractor = DOCUMENT_EXTRACTORS["pdf"]
    elif "docx" in DOCUMENT_EXTRACTORS and data.startswith(_ZIP_SIGNATURE):
        extractor = DOCUMENT_EXTRACTORS["docx"]
    else:
        extractor = DOCUMENT_EXTRACTORS["txt"]
    text = extractor(data)

    if not text.strip():
        raise NoDocumentTextError("No readable text was found in the uploaded file.")
    return text.strip()


def _extract_pdf_text(data: bytes) -> str:
    try:
        with fitz.open(stream=data, filetype="pdf") as document:
            return "\n".join(page.get_text("text") for page in document)
    except (fitz.FileDataError, fitz.EmptyFileError, RuntimeError) as exc:
        raise DocumentTypeError("The uploaded PDF could not be read.") from exc


def _extract_docx_text(data: bytes) -> str:
    try:
        with zipfile.ZipFile(BytesIO(data)) as archive:
            names = set(archive.namelist())
            if not _DOCX_REQUIRED_FILES.issubset(names):
                raise DocumentTypeError("The uploaded file is not a valid DOCX document.")
            if sum(item.file_size for item in archive.infolist()) > MAX_DOCX_UNCOMPRESSED_SIZE_BYTES:
                raise DocumentTooLargeError("The document contents exceed the processing limit.")
        document = Document(BytesIO(data))
    except DocumentTypeError:
        raise
    except DocumentTooLargeError:
        raise
    except (
        zipfile.BadZipFile,
        PackageNotFoundError,
        XMLSyntaxError,
        KeyError,
        OSError,
        ValueError,
    ) as exc:
        raise DocumentTypeError("The uploaded DOCX document could not be read.") from exc

    content = _docx_container_text(document)
    seen_story_parts: set[object] = set()
    for section in document.sections:
        for story in (section.header, section.footer):
            if story.part not in seen_story_parts:
                seen_story_parts.add(story.part)
                content.extend(_docx_container_text(story))
    return "\n".join(content)


def _docx_container_text(container: BlockItemContainer) -> list[str]:
    content: list[str] = []
    for item in container.iter_inner_content():
        if isinstance(item, Paragraph):
            content.append(item.text)
        elif isinstance(item, Table):
            content.extend(
                cell.text
                for row in item.rows
                for cell in row.cells
            )
    return content


def _extract_txt_text(data: bytes) -> str:
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise DocumentTypeError("The uploaded file is not a supported document type.") from exc

    if any(ord(character) in _TEXT_CONTROL_BYTES for character in text):
        raise DocumentTypeError("The uploaded file is not a supported document type.")
    return text


DOCUMENT_EXTRACTORS = {
    "pdf": _extract_pdf_text,
    "docx": _extract_docx_text,
    "txt": _extract_txt_text,
}
