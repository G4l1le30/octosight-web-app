from app.schemas.schemas import TicketUpdate, AuditLogResponse


class TestTicketUpdate:
    def test_partial_update_allows_empty_fields(self):
        update = TicketUpdate(status="In Review")
        assert update.status == "In Review"
        assert update.priority is None

    def test_full_update(self):
        update = TicketUpdate(
            status="Confirmed",
            priority="High",
            investigation_notes="Found malicious URL",
            action_taken="Escalated to team",
        )
        assert update.status == "Confirmed"
        assert update.priority == "High"

    def test_empty_status_causes_no_change(self):
        update = TicketUpdate(investigation_notes="Adding notes")
        assert update.status is None
        assert update.investigation_notes == "Adding notes"


class TestAuditLogResponse:
    def test_from_attributes(self):
        log = AuditLogResponse(
            id="1",
            ticket_id="OCTO-001",
            admin_id="admin-1",
            action_taken="Status changed",
            old_status="Submitted",
            new_status="In Review",
            notes="Reviewed",
            created_at="2026-05-29T00:00:00Z",
        )
        assert log.ticket_id == "OCTO-001"
        assert log.action_taken == "Status changed"
