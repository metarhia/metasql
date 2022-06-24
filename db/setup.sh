PGPASSWORD=postgres psql -h 127.0.0.1 -f install.sql -U postgres
PGPASSWORD=marcus psql -h 127.0.0.1 -d metasql -f structure.sql -U marcus
PGPASSWORD=marcus psql -h 127.0.0.1 -d metasql -f data.sql -U marcus
