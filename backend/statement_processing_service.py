from langchain_groq import ChatGroq
from pdfplumber import PDF
from pdfminer.pdfdocument import PDFPasswordIncorrect
from typing import BinaryIO, List, Union
import io
from config import settings
from pydantic import BaseModel, Field
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import logging
import json

logger = logging.getLogger(__name__)


class BalanceModel(BaseModel):
    opening: float = Field(
        ..., description="Opening balance at the start of the statement period."
    )
    closing: float = Field(
        ..., description="Closing balance at the end of the statement period."
    )


class DebitCreditModel(BaseModel):
    count: int = Field(
        ..., description="Total number of transactions in this category."
    )
    amount: float = Field(
        ..., description="Total monetary amount for transactions in this category."
    )
    description: str = Field(
        ..., description="Short summary describing this transaction category."
    )


class TransactionsModel(BaseModel):
    debits: DebitCreditModel = Field(
        ..., description="Aggregated information for debit or withdrawal transactions."
    )
    credits: DebitCreditModel = Field(
        ..., description="Aggregated information for credit or deposit transactions."
    )


class StatementProcessingResult(BaseModel):
    from_date: str = Field(
        ..., description="Statement start date as shown in the document."
    )
    to_date: str = Field(
        ..., description="Statement end date as shown in the document."
    )
    balance: BalanceModel = Field(
        ..., description="Opening and closing balances for the statement period."
    )
    currency: str = Field(
        ..., description="Primary currency code or symbol used in the statement."
    )
    transactions: TransactionsModel = Field(
        ..., description="Summarized debit and credit transaction totals and counts."
    )
    observations: List[str] = Field(
        default_factory=list,
        description="Notes about assumptions, ambiguities, missing values, or inconsistencies.",
    )


template = """
You are a bank statement extraction assistant.

You will receive one or more bank statement tables in Markdown format.
Extract and return the fields required by `StatementProcessingResult`.

Extraction rules:
1. Use only information present in the provided tables.
2. Be robust to alternate labels and synonyms (for example: "opening balance"/"beginning balance", "closing balance"/"ending balance", "debit"/"withdrawal", "credit"/"deposit").
3. Normalize numeric values:
    - Remove currency symbols and thousand separators.
    - Convert negatives shown as `-123.45` or `(123.45)` to negative numbers.
    - Return numeric fields as numbers, not strings.
4. Determine `currency` from symbols/codes (e.g., USD, EUR, INR). If symbol/code is missing use INR as default.
5. `observations` should include key notes on transaction patterns.
6. If a required field is missing, still return a best-effort value using:
    - empty string for unknown text/date/currency
    - 0 for unknown numeric values
    - [] for observations when there is nothing notable

Provided markdown tables:
{tables}
"""


class StatementProcessingService:
    def __init__(self, api_key: str = settings.GROQ_API_KEY):
        self.llm = ChatGroq(
            model="openai/gpt-oss-120b",
            api_key=api_key,
            model_kwargs={
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "StatementProcessingResult",
                        "schema": StatementProcessingResult.model_json_schema(),
                    },
                },
            },
        )
        self.prompt = PromptTemplate.from_template(template)
        self.chain = self.prompt | self.llm | StrOutputParser()

    def _get_reader(
        self,
        pdf_source: Union[str, bytes, BinaryIO],
        password: str = None,
    ) -> PDF:
        try:
            # open the PDF file with the provided password (if any)
            if isinstance(pdf_source, (bytes, bytearray)):
                pdf_source = io.BytesIO(pdf_source)
            return PDF.open(pdf_source, password=password)
        except PDFPasswordIncorrect:
            # if the password is incorrect, raise a ValueError with a clear message
            raise ValueError("Incorrect password for PDF file.")
        except Exception as e:
            # for any other exceptions, raise a ValueError with the original exception message
            raise ValueError(f"Failed to open PDF: {e}")

    def extract_tables_from_pdf(self, reader: PDF) -> List[List[List[str | None]]]:
        # extract tables from all pages of the PDF using pdfplumber
        tables = []
        for page in reader.pages:
            tables.extend(page.extract_tables())
        return tables

    def _format_tables(self, tables: List[List[List[str | None]]]) -> str:
        # if not tables, return empty string
        if not tables:
            return ""

        # initialize markdown parts list
        markdown_parts: List[str] = []

        # process each table and convert to markdown format
        for table in tables:
            if not table:
                continue

            # determine the maximum number of columns in the table
            max_columns = max((len(row) for row in table if row), default=0)
            if max_columns == 0:
                continue

            # normalize rows to have the same number of columns
            # and convert None to empty strings
            normalized_rows: List[List[str]] = []
            for row in table:
                row_values = ["" if cell is None else str(cell).strip() for cell in row]
                if len(row_values) < max_columns:
                    row_values.extend([""] * (max_columns - len(row_values)))
                normalized_rows.append(row_values)

            # add markdown table header and separator
            header = normalized_rows[0]
            markdown_parts.append("| " + " | ".join(header) + " |")
            markdown_parts.append("| " + " | ".join(["---"] * max_columns) + " |")

            # add markdown table rows
            for row in normalized_rows[1:]:
                markdown_parts.append("| " + " | ".join(row) + " |")

            markdown_parts.append("")

        return "\n".join(markdown_parts).strip()

    def process_statement(
        self, pdf_source: Union[str, bytes, BinaryIO], password: str = None
    ) -> StatementProcessingResult:
        # open the PDF
        reader = self._get_reader(pdf_source, password=password)

        # extract tables and format them as markdown for the LLM
        tables = self.extract_tables_from_pdf(reader)
        formatted_tables = self._format_tables(tables)

        # extract structured information from the formatted tables using the LLM chain
        response = self.chain.invoke({"tables": formatted_tables})

        # parse the JSON response and return a StatementProcessingResult instance
        json_response = json.loads(response)
        return StatementProcessingResult(**json_response)
