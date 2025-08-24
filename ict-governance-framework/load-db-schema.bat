@echo off
REM Load environment variables from .env
for /f "usebackq tokens=1,2 delims==" %%A in ("ict-governance-framework\.env") do (
    set %%A=%%B
)

REM Set path to psql.exe if not in PATH
REM set PSQL_PATH="C:\Program Files\PostgreSQL\15\bin\psql.exe"
REM If psql is in PATH, you can just use "psql"

REM List your schema files here
set SCHEMA_FILES=db-data-collection-schema.sql db-notifications-schema.sql db-schema.sql

REM Loop through each schema file and execute
for %%F in (%SCHEMA_FILES%) do (
    echo Loading %%F ...
    psql -h %PGHOST% -U %PGUSER% -d %PGDATABASE% -p %PGPORT% -f "ict-governance-framework\%%F"
    if errorlevel 1 (
        echo Error loading %%F
        exit /b 1
    )
)

echo All schema files loaded successfully.
pause