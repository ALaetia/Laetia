-- Rode APENAS se você já executou o schema.sql antes desta versão.
alter table option_groups add column if not exists role text check (role in ('stone','spacer','medal','crucifix'));
alter table option_values add column if not exists shape text;
alter table option_values add column if not exists image_url text;

-- (opcional) ativar a montagem visual no terço de exemplo:
update option_groups set role = 'stone'    where name = 'Cor da pedra';
update option_groups set role = 'spacer'   where name = 'Entremeio';
update option_groups set role = 'medal'    where name = 'Medalha';
update option_groups set role = 'crucifix' where name = 'Crucifixo';
update option_values set swatch = '#C9CDD2' where label = 'Prata';
update option_values set swatch = '#C9A45C' where label = 'Dourado';
update option_values set shape = 'oval'   where label = 'Nossa Senhora das Graças';
update option_values set shape = 'round'  where label = 'São Bento';
update option_values set shape = 'heart'  where label = 'Sagrado Coração';
update option_values set shape = 'simple' where label = 'Simples';
update option_values set shape = 'detail' where label = 'Trabalhado';
