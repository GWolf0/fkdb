# Fake DB

- This an app that mimics the basic functions of an sql database, with a frontend.

- Supports:
  - Database: one instance, clear
  - Table: create, delete, alter
  - Columns: types("id"|"fid"|"string"|"number"|"boolean")
  - Row: CRUD
  - SQL-Like: Select statement, with (where, offset, and limit)

- Notes:
  - Main logic is written in "FKDBService" class, "src/services/fkdbService.ts"
  - SQL-Like logic is written in "FKDBLangService" class, "src/services/fkdbLangService.ts"

- Notes to self:
  - Not well tested