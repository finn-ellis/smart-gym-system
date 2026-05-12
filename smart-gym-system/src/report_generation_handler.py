import time

from .data_stores import ReportsArchive
from .datatypes import MetricsLoad, ReportType, Report

class ReportGenerationHandler:
    """
    Generates reports on regular increments.
    """
    def __init__(self, reports_archive: ReportsArchive) -> None:
        self._reports_archive = reports_archive
        self.reportTemplates: dict[ReportType, str] = {
            ReportType.HOURLY: "Hourly demo report",
            ReportType.DAILY: "Daily demo report",
            ReportType.WEEKLY: "Weekly demo report",
            ReportType.MONTHLY: "Monthly demo report",
        }
        self._buffered_metrics: list[MetricsLoad] = []

    def bufferMetrics(self, metrics: MetricsLoad) -> None:
        self._buffered_metrics.append(metrics)

    def compileReport(self, report_type: ReportType) -> Report:
        created_at = time.time()
        report = Report(
            report_id=f"report-{report_type.value.lower()}-{time.time_ns()}",
            report_type=report_type,
            title=self.reportTemplates[report_type],
            created_at=created_at,
            data={
                "summary": "Placeholder report generated for the CS460 demo.",
                "metrics": self._buffered_metrics,
            },
        )
        return self._reports_archive.save_report(report)
