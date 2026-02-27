-- 032_asana_destination.sql
-- Add Asana as an output route destination type

-- Drop the old check constraint and recreate with asana included
alter table public.output_routes
    drop constraint if exists output_routes_destination_type_check;

alter table public.output_routes
    add constraint output_routes_destination_type_check
    check (destination_type in ('http', 'slack', 'discord', 'telegram', 'teams', 'asana'));
