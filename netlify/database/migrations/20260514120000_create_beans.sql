CREATE TABLE beans (
  id INTEGER PRIMARY KEY,
  roaster TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  origin TEXT NOT NULL DEFAULT '',
  date_purchased DATE,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  great_on JSONB NOT NULL DEFAULT '[]'::jsonb
);
