"""
Simple report generator stub to satisfy imports and enable basic report downloads.
"""

import os
import json
from datetime import datetime


class ReportGenerator:
    def __init__(self, output_dir: str | None = None):
        self.output_dir = output_dir or os.path.join(os.path.dirname(__file__), 'data', 'reports')
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_pdf(self, report: dict) -> str:
        """
        Stub implementation: writes the report as a JSON file with .pdf extension.
        Replace with real PDF generation when available.
        """
        report_id = report.get('id') or str(int(datetime.now().timestamp()))
        filename = f"report_{report_id}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        # Store as JSON content for now
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)
        return filepath


# Export a singleton-like instance for existing imports
report_generator = ReportGenerator()


