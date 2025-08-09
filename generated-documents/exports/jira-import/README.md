# Jira CSV Import for Activity List


This folder contains CSVs for importing all 180 activities from `generated-documents/planning-artifacts/activity-list.md` into Jira, split by activity range for easier handling.

## Files
- `activity-issues-A001-A040.csv`
- `activity-issues-A041-A072.csv`
- `activity-issues-A073-A120.csv`
- `activity-issues-A121-A160.csv`
- `activity-issues-A161-A180.csv`

## Mappings
- Summary → Activity ID + Name
- Description → WBS + Description + Deliverables + Acceptance + Context (multi-line)
- Custom fields (create if needed):
  - WBS Code (text)
  - Dependencies (text)
  - Dependency Type (select: FS/SS/FF)
  - Effort Hours (number)
  - Duration Weeks (number)
  - Resources (text)
  - Deliverables (text)
  - Acceptance Criteria (text)
  - Risks (text)
  - Context (text)

## Import Steps (Jira Cloud)
1. In Jira: Jira Settings → System → External System Import → CSV.
2. Upload each CSV file in turn.
3. Choose target Project (update `Project Key` column if not `PROJ`).
4. Map columns to fields; for custom fields, create them first if they don’t exist.
5. Set default Issue Type (Task) if not mapped per-row.
6. Confirm date/time & delimiter settings; start import.

## Notes
- Placeholders are used for activities not fully defined in the activity-list.md.
- Dependencies use Activity IDs (e.g., `A001;A002`). You can later convert to issue links using Automation or a marketplace app.
- Labels include `activity-list` and phase for filtering.
- Adjust Assignee/Reporter/Due Date as needed before import.
- If your Jira requires Components, ensure the Components exist or remove the column.
