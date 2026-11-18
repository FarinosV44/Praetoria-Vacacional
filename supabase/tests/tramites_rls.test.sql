-- =============================================================================
-- Issue #176 — aislamiento entre propietarios (RLS) del servicio de trámites.
--
--   psql "$SUPABASE_DB_URL" -f supabase/tests/tramites_rls.test.sql
--   (en local: stub + migración, ver supabase/tests/_supabase_stub.sql)
--
-- Una sola transacción que termina en ROLLBACK: no deja filas. Cualquier
-- `assert` fallido aborta con un mensaje claro.
-- =============================================================================

begin;

do $$
declare
  ua uuid := gen_random_uuid();
  ub uuid := gen_random_uuid();
  acc_a uuid; acc_b uuid; prop_a uuid; prop_b uuid; fil_a uuid; fil_b uuid; doc_b uuid;
begin
  insert into auth.users (id, email) values (ua, 'a@example.test'), (ub, 'b@example.test');

  insert into owner_accounts (kind, legal_name, tax_id, contact_name, email, phone, billing_address, status)
  values ('particular', 'Cliente A', '00000000T', 'A', 'a@example.test', '600000000', 'Calle A 1', 'activo')
  returning id into acc_a;
  insert into owner_accounts (kind, legal_name, tax_id, contact_name, email, phone, billing_address, status)
  values ('empresa', 'Cliente B SL', 'B00000000', 'B', 'b@example.test', '600000001', 'Calle B 1', 'activo')
  returning id into acc_b;

  insert into owner_memberships (account_id, user_id) values (acc_a, ua), (acc_b, ub);
  insert into owner_internal_notes (account_id, notes) values (acc_a, 'nota interna A');

  insert into managed_properties (account_id, alias, street, postal_code, municipality, province)
  values (acc_a, 'Piso A', 'Calle A', '46000', 'Valencia', 'Valencia') returning id into prop_a;
  insert into managed_properties (account_id, alias, street, postal_code, municipality, province)
  values (acc_b, 'Piso B', 'Calle B', '46400', 'Cullera', 'Valencia') returning id into prop_b;

  insert into filings (reference, account_id, property_id, service_code, status, title)
  values ('TR-AAAA01', acc_a, prop_a, 'ses_alta', 'solicitado', 'Alta A') returning id into fil_a;
  insert into filings (reference, account_id, property_id, service_code, status, title)
  values ('TR-BBBB01', acc_b, prop_b, 'ses_alta', 'solicitado', 'Alta B') returning id into fil_b;

  insert into filing_events (filing_id, account_id, actor, kind, message, visible_to_owner)
  values (fil_a, acc_a, '{"type":"admin","id":null,"label":"Equipo"}', 'nota', 'visible', true),
         (fil_a, acc_a, '{"type":"admin","id":null,"label":"Equipo"}', 'nota', 'interna', false);

  insert into owner_documents (account_id, property_id, kind, filename, mime, size_bytes, storage_key, sha256, uploaded_by)
  values (acc_b, prop_b, 'otro', 'b.pdf', 'application/pdf', 10, acc_b::text || '/doc-b', 'x', 'owner')
  returning id into doc_b;
  insert into owner_documents (account_id, property_id, kind, filename, mime, size_bytes, storage_key, sha256, uploaded_by, is_official_proof)
  values (acc_a, prop_a, 'justificante_oficial', 'a.pdf', 'application/pdf', 10, acc_a::text || '/doc-a', 'y', 'admin', true);

  insert into storage.objects (bucket_id, name) values
    ('owner-documents', acc_a::text || '/doc-a'),
    ('owner-documents', acc_b::text || '/doc-b');

  insert into tramites_audit (actor, action, account_id, target_type) values ('{"type":"system"}', 'test', acc_a, 'cuenta');

  -- Guardamos los ids para las comprobaciones con otro rol.
  perform set_config('pv.ua', ua::text, true);
  perform set_config('pv.acc_a', acc_a::text, true);
  perform set_config('pv.acc_b', acc_b::text, true);
  perform set_config('pv.doc_b', doc_b::text, true);
  perform set_config('pv.prop_b', prop_b::text, true);
end $$;

-- ------------------------------------------------- como propietario A -------
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('pv.ua'), true);

do $$
declare n int; ok boolean;
begin
  select count(*) into n from owner_accounts;            assert n = 1, 'A solo ve su cuenta';
  select count(*) into n from owner_accounts where id = current_setting('pv.acc_b')::uuid;
  assert n = 0, 'A no puede leer la cuenta de B ni sabiendo su id';
  select count(*) into n from managed_properties;        assert n = 1, 'A solo ve sus viviendas';
  select count(*) into n from filings;                   assert n = 1, 'A solo ve sus expedientes';
  select count(*) into n from owner_documents;           assert n = 1, 'A solo ve sus documentos';
  select count(*) into n from owner_documents where id = current_setting('pv.doc_b')::uuid;
  assert n = 0, 'A no ve el documento de B (anti-IDOR)';
  select count(*) into n from filing_events;             assert n = 1, 'A no ve las notas internas del expediente';
  select count(*) into n from storage.objects;           assert n = 1, 'A solo puede descargar archivos de su carpeta';
  select count(*) into n from owner_memberships;         assert n = 1, 'A solo ve su pertenencia';

  -- Tablas internas: sin acceso.
  begin
    perform 1 from owner_internal_notes;
    assert false, 'A no debe poder leer notas internas';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from tramites_audit;
    assert false, 'A no debe poder leer la auditoría';
  exception when insufficient_privilege then null;
  end;

  -- Sin escrituras directas: todo pasa por el servidor.
  ok := true;
  begin
    insert into managed_properties (account_id, alias, street, postal_code, municipality, province)
    values (current_setting('pv.acc_b')::uuid, 'intrusa', 'x', '46000', 'x', 'x');
    ok := false;
  exception when insufficient_privilege then null;
  end;
  assert ok, 'A no puede crear viviendas en la cuenta de B';

  begin
    update owner_accounts set reservation_credits = 999;
    assert false, 'A no puede modificar su saldo de reservas';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.tramites_adjust_credits(current_setting('pv.acc_a')::uuid, 100);
    assert false, 'A no puede llamar a la función de saldo';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ------------------------------------------------- sin sesión (anon) --------
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$
begin
  begin
    perform 1 from owner_accounts;
    assert false, 'anon no puede leer cuentas';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ------------------------------------------------- integridad ---------------
reset role;
do $$
begin
  begin
    update filing_events set message = 'editado';
    assert false, 'el historial no se puede editar';
  exception when raise_exception then null;
  end;
  begin
    delete from owner_documents where is_official_proof;
    assert false, 'un justificante oficial no se puede borrar';
  exception when raise_exception then null;
  end;
  begin
    update filings set status = 'presentado' where reference = 'TR-AAAA01';
    assert false, 'presentado exige fecha y canal';
  exception when check_violation then null;
  end;
  begin
    insert into owner_documents (account_id, kind, filename, mime, size_bytes, storage_key, sha256, uploaded_by)
    values (current_setting('pv.acc_a')::uuid, 'otro', 'x.pdf', 'application/pdf', 1,
            current_setting('pv.acc_b') || '/colado', 'z', 'owner');
    assert false, 'la ruta del archivo debe empezar por la cuenta propietaria';
  exception when check_violation then null;
  end;
  assert public.tramites_adjust_credits(current_setting('pv.acc_a')::uuid, -5) = 0,
    'el saldo no baja de cero';
end $$;

rollback;
