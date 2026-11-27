// 표 권한 (011_table_grants.sql, #113). 로컬 Supabase 필요
// 원격은 새 표에 API 역할 권한을 자동으로 주지 않는다. 표를 더할 때 서버 권한을 빠뜨리지 않게 본다
import { describe, expect, it } from "vitest";
import { psql } from "./local-supabase";

describe("service_role 표 권한", () => {
  it("모든 public 표에 select, insert, update, delete 가 있다", () => {
    const missing = psql(`
      select t.table_name || ' ' || p.priv
      from information_schema.tables t
      cross join unnest(array['SELECT','INSERT','UPDATE','DELETE']) as p(priv)
      where t.table_schema = 'public' and t.table_type = 'BASE TABLE'
        and not exists (
          select 1 from information_schema.role_table_grants g
          where g.table_schema = 'public' and g.table_name = t.table_name
            and g.grantee = 'service_role' and g.privilege_type = p.priv
        )
      order by 1`);
    expect(missing).toBe("");
  });
});
