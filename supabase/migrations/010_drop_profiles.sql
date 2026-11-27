-- 로그인이 없어(D-018) 쓰지 않는 profiles, completions 표를 지운다 (data.md 5판 §2, #91). completions 가 profiles 를 참조하므로 먼저 지운다
drop table if exists public.completions;
drop table if exists public.profiles;
