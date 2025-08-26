# Secure Score Normalized Database Tables

This section describes the normalized PostgreSQL tables used to store Microsoft Graph Secure Score data in this project. These tables support robust, transaction-safe sync logic and serve as the single source of truth for backend endpoints.

## Tables


### 1. `secure_score`
Stores the main Secure Score records retrieved from Microsoft Graph.
- `id` (Primary Key)
- `vendor_information_id` (Foreign Key to `vendor_information`)
- `created_datetime`
- `current_score`
- `max_score`
- `active_user_count`
- `licensed_user_count`
- `tenant_id`
- `azure_tenant_id`


### 2. `vendor_information`
Contains metadata about the vendor/source of the Secure Score data.
- `id` (Primary Key)
- `vendor`
- `provider`
- `sub_provider`


### 3. `average_comparative_score`
Stores comparative scores for benchmarking against similar organizations.
- `id` (Primary Key)
- `average_score`
- `secure_score_id` (Foreign Key to `secure_score`)
- `basis`


### 4. `control_score`
Represents individual control scores contributing to the overall Secure Score.
- `id` (Primary Key)
- `score`
- `score_in_percentage`
- `control_name`
- `description`
- `implementation_status`
- `secure_score_id` (Foreign Key to `secure_score`)
- `control_category`


## Relationships
- `secure_score` references `vendor_information` via `vendor_information_id`.
- `average_comparative_score` and `control_score` reference `secure_score` via `secure_score_id`.

## Usage
These tables are populated via scheduled sync with Microsoft Graph and are used by backend API endpoints for dashboards and executive summaries.

---
For schema details or sample queries, see the backend code or contact the project maintainer.