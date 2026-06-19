alter table public.integrations
  add constraint integrations_encrypted_token_v1_envelope_check
  check (encrypted_token ~ '^v1:[A-Za-z0-9+/]+={0,2}:[A-Za-z0-9+/]+={0,2}:[A-Za-z0-9+/]+={0,2}$') not valid;

alter table public.integrations
  add constraint integrations_refresh_token_v1_envelope_check
  check (refresh_token is null or refresh_token ~ '^v1:[A-Za-z0-9+/]+={0,2}:[A-Za-z0-9+/]+={0,2}:[A-Za-z0-9+/]+={0,2}$') not valid;

comment on column public.integrations.encrypted_token is
  'AES-256-GCM encrypted access token using the application ENCRYPTION_KEY and v1:iv:tag:ciphertext envelope format. Existing legacy plaintext rows must be re-encrypted before validating integrations_encrypted_token_v1_envelope_check.';

comment on column public.integrations.refresh_token is
  'AES-256-GCM encrypted refresh token using the application ENCRYPTION_KEY and v1:iv:tag:ciphertext envelope format. Existing legacy plaintext rows must be re-encrypted before validating integrations_refresh_token_v1_envelope_check.';
