-- House recommendation ledger. Unowned (auth off): one shared desk book.
create table if not exists house_marks (
  id                  text primary key,
  symbol              text not null,
  session_date        date not null,
  source              text not null,
  engine_version      text not null,
  stance              text not null,
  setup               text not null,
  entry_print         double precision not null,
  spy_print           double precision,
  stop_pct            double precision,
  stop_kind           text,
  take_pct            double precision,
  time_horizon_td     integer not null,
  event_date          date,
  event_label         text,
  regime              text not null,
  confidence_score    integer,
  confidence_agreed   integer,
  radar_tape          integer,
  radar_quiet         integer,
  radar_date          integer,
  radar_gap           integer,
  why                 text not null,
  status              text not null,
  outcome             text,
  close_reason        text,
  closed_at           timestamptz,
  close_print         double precision,
  close_session_date  date,
  fwd_5d_pct          double precision,
  fwd_10d_pct         double precision,
  vs_spy_5d           double precision,
  vs_spy_10d          double precision,
  vs_spy_close        double precision,
  sentence            text not null default '',
  created_at          timestamptz not null default now()
);

create unique index if not exists house_marks_symbol_session_source
  on house_marks (symbol, session_date, source);

create index if not exists house_marks_status_idx
  on house_marks (status, session_date desc);

create index if not exists house_marks_symbol_idx
  on house_marks (symbol, session_date desc);
