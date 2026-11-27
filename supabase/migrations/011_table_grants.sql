-- 원격 프로젝트가 새 표에 API 역할 권한을 자동으로 주지 않아
-- 서버(service role)가 표를 읽고 쓰지 못했다 (permission denied for table rooms, #113).

-- 서버: 모든 표 읽기, 쓰기
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- anon, authenticated 에는 표 권한을 주지 않는다. 브라우저는 표를 직접 읽지 않고
-- 실시간 채널만 쓰므로, 쓰지 않는 읽기 길을 열지 않는다 (최소 권한, #113)

-- 다음 마이그레이션에서 만드는 표도 서버가 읽고 쓰게 한다.
-- anon, authenticated 의 쓰기 기본 권한 회수(002)는 그대로 둔다
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
