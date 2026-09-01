-- ── 0007 Lab Dispatch register ───────────────────────────────────────────────
-- Extends lab_cases so it mirrors the clinic's handwritten "Lab Dispatch"
-- register: how many units, who sent it, who received it back, whether the
-- clinic sent the WhatsApp confirmation, and a Trial / Final outcome (a trial
-- can be re-sent to the same or another lab, e.g. for porcelain).
--
-- Safe to run more than once (guards with IF NOT EXISTS / DROP-then-ADD).

alter table lab_cases add column if not exists units          integer default 1;
alter table lab_cases add column if not exists sent_by        text;
alter table lab_cases add column if not exists received_by    text;
alter table lab_cases add column if not exists whatsapp_sent  boolean default false;

-- Widen the status list to include the register's Trial / Final states, while
-- keeping the original values valid for any existing rows.
alter table lab_cases drop constraint if exists lab_cases_status_check;
alter table lab_cases add constraint lab_cases_status_check
  check (status in ('Sent', 'In Progress', 'Trial', 'Final', 'Received', 'Fitted'));
