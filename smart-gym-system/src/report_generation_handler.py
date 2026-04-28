from .datatypes import MetricsLoad, ReportType, Report

class ReportGenerationHandler:
    """
    Generates reports on regular increments.
    """
    def __init__(self) -> None:
        self.reportTemplates = {}

    def bufferMetrics(self, metrics: MetricsLoad) -> None:
        pass

    def compileReport(self, report_type: ReportType) -> Report:
        pass
