defmodule CalAi.Repo.Migrations.EnableTimescaledb do
  use Ecto.Migration

  def up do
    # Enable TimescaleDB extension
    execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE")

    # Create hypertables for time-series data
    execute("""
    SELECT create_hypertable('meals', 'eaten_at',
      chunk_time_interval => INTERVAL '1 week',
      if_not_exists => TRUE)
    """)

    # Create continuous aggregates for daily nutrition summaries
    execute("""
    CREATE MATERIALIZED VIEW IF NOT EXISTS daily_nutrition_summary
    WITH (timescaledb.continuous) AS
    SELECT
      user_id,
      time_bucket('1 day', eaten_at) as day,
      COUNT(*) as total_meals,
      SUM(total_calories) as daily_calories,
      SUM(total_protein) as daily_protein,
      SUM(total_carbs) as daily_carbs,
      SUM(total_fat) as daily_fat,
      SUM(total_fiber) as daily_fiber,
      AVG(confidence_score) as avg_confidence
    FROM meals
    WHERE processing_status = 'completed'
    GROUP BY user_id, time_bucket('1 day', eaten_at)
    """)

    # Create continuous aggregates for weekly summaries
    execute("""
    CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_nutrition_summary
    WITH (timescaledb.continuous) AS
    SELECT
      user_id,
      time_bucket('1 week', eaten_at) as week,
      COUNT(*) as total_meals,
      SUM(total_calories) as weekly_calories,
      SUM(total_protein) as weekly_protein,
      SUM(total_carbs) as weekly_carbs,
      SUM(total_fat) as weekly_fat,
      COUNT(DISTINCT DATE(eaten_at)) as active_days
    FROM meals
    WHERE processing_status = 'completed'
    GROUP BY user_id, time_bucket('1 week', eaten_at)
    """)

    # Refresh policies for continuous aggregates
    execute("""
    SELECT add_continuous_aggregate_policy('daily_nutrition_summary',
      start_offset => INTERVAL '3 days',
      end_offset => INTERVAL '1 hour',
      schedule_interval => INTERVAL '1 hour')
    """)

    execute("""
    SELECT add_continuous_aggregate_policy('weekly_nutrition_summary',
      start_offset => INTERVAL '2 weeks',
      end_offset => INTERVAL '1 day',
      schedule_interval => INTERVAL '1 day')
    """)

    # Create retention policy (keep detailed data for 2 years)
    execute("""
    SELECT add_retention_policy('meals', INTERVAL '2 years')
    """)
  end

  def down do
    execute("DROP MATERIALIZED VIEW IF EXISTS weekly_nutrition_summary CASCADE")
    execute("DROP MATERIALIZED VIEW IF EXISTS daily_nutrition_summary CASCADE")
    execute("DROP EXTENSION IF EXISTS timescaledb CASCADE")
  end
end
