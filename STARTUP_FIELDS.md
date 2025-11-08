# Startup Fields Added

The following fields have been added to the startup schema:

- logo (TEXT)
- pitch_deck (TEXT)  
- cohort (TEXT)
- support_program (TEXT)
- industry (TEXT)
- email (TEXT)
- team (TEXT)
- generating_revenue (TEXT)
- ask (TEXT)
- legal_entity (TEXT)

## Database Migration
- Existing tables will automatically have these columns added on server restart
- Existing startups will have NULL/empty values for these fields

## Admin UI Update Needed
The admin panel needs to be updated to:
1. Show all fields in a table view (Airtable-style)
2. Allow editing all fields
3. Display the information in the player view (optional)

For now, startups have been seeded with Bilo having full information as an example.
