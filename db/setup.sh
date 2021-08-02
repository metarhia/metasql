psql -f install.sql -U postgres
PGPASSWORD=marcus psql -d metasql -f structure.sql -U marcus
PGPASSWORD=marcus psql -d metasql -f data.sql -U marcus
