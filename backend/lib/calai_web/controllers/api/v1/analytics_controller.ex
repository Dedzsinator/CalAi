defmodule CalAiWeb.Api.V1.AnalyticsController do
  use CalAiWeb, :controller

  alias CalAi.{Analytics, Accounts, Cache}

  action_fallback(CalAiWeb.FallbackController)

  def daily_summary(conn, _params) do
    user = conn.assigns.current_user

    case Cache.get_cached_analytics(user.id, "daily") do
      {:ok, cached_data} ->
        render(conn, "analytics.json", analytics: cached_data)

      {:miss, _} ->
        case Analytics.get_user_analytics(user.id, "daily") do
          {:ok, analytics_data} ->
            Cache.cache_analytics(user.id, "daily", analytics_data)
            render(conn, "analytics.json", analytics: analytics_data)

          {:error, reason} ->
            {:error, reason}
        end
    end
  end

  def weekly_summary(conn, _params) do
    user = conn.assigns.current_user

    case Cache.get_cached_analytics(user.id, "weekly") do
      {:ok, cached_data} ->
        render(conn, "analytics.json", analytics: cached_data)

      {:miss, _} ->
        case Analytics.get_user_analytics(user.id, "weekly") do
          {:ok, analytics_data} ->
            Cache.cache_analytics(user.id, "weekly", analytics_data)
            render(conn, "analytics.json", analytics: analytics_data)

          {:error, reason} ->
            {:error, reason}
        end
    end
  end

  def monthly_summary(conn, _params) do
    user = conn.assigns.current_user

    case Cache.get_cached_analytics(user.id, "monthly") do
      {:ok, cached_data} ->
        render(conn, "analytics.json", analytics: cached_data)

      {:miss, _} ->
        case Analytics.get_user_analytics(user.id, "monthly") do
          {:ok, analytics_data} ->
            Cache.cache_analytics(user.id, "monthly", analytics_data)
            render(conn, "analytics.json", analytics: analytics_data)

          {:error, reason} ->
            {:error, reason}
        end
    end
  end

  def trends(conn, params) do
    user = conn.assigns.current_user
    period = Map.get(params, "period", "week")

    trends_data = Analytics.get_trends(user.id, period)
    render(conn, "trends.json", trends: trends_data)
  end

  def index(conn, params) do
    user = conn.assigns.current_user
    range = Map.get(params, "range", "week")

    case Analytics.get_user_analytics(user.id, range) do
      {:ok, analytics_data} ->
        render(conn, "analytics.json", analytics: analytics_data)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def nutrition_breakdown(conn, params) do
    user = conn.assigns.current_user
    start_date = Map.get(params, "start_date")
    end_date = Map.get(params, "end_date")
    group_by = Map.get(params, "group_by", "day")

    with {:ok, start_date} <- Date.from_iso8601(start_date),
         {:ok, end_date} <- Date.from_iso8601(end_date) do
      breakdown = Analytics.get_nutrition_breakdown(user.id, start_date, end_date, group_by)
      render(conn, "nutrition_breakdown.json", breakdown: breakdown)
    else
      {:error, :invalid_format} ->
        {:error, :bad_request, "Invalid date format. Use YYYY-MM-DD"}
    end
  end

  def meal_timing(conn, params) do
    user = conn.assigns.current_user
    days = Map.get(params, "days", "30") |> String.to_integer()

    patterns = Analytics.get_meal_timing_patterns(user.id, days)
    render(conn, "meal_timing.json", patterns: patterns)
  end

  def calorie_trends(conn, params) do
    user = conn.assigns.current_user
    days = Map.get(params, "days", "30") |> String.to_integer()
    include_prediction = Map.get(params, "include_prediction") == "true"

    trends = Analytics.get_calorie_trends(user.id, days, include_prediction)
    render(conn, "calorie_trends.json", trends: trends)
  end

  def weight_progress(conn, params) do
    user = conn.assigns.current_user
    days = Map.get(params, "days", "90") |> String.to_integer()

    progress = Analytics.get_weight_progress(user.id, days)
    render(conn, "weight_progress.json", progress: progress)
  end

  def habits(conn, _params) do
    user = conn.assigns.current_user

    habits = Analytics.get_user_habits(user.id)
    render(conn, "habits.json", habits: habits)
  end

  def insights(conn, _params) do
    user = conn.assigns.current_user

    insights = Analytics.generate_user_insights(user.id)
    render(conn, "insights.json", insights: insights)
  end

  def goal_progress(conn, _params) do
    user = conn.assigns.current_user

    progress = Analytics.get_goal_progress(user.id)
    render(conn, "goal_progress.json", progress: progress)
  end

  def food_variety(conn, params) do
    user = conn.assigns.current_user
    days = Map.get(params, "days", "30") |> String.to_integer()

    variety = Analytics.get_food_variety_analysis(user.id, days)
    render(conn, "food_variety.json", variety: variety)
  end

  def macro_distribution(conn, params) do
    user = conn.assigns.current_user
    start_date = Map.get(params, "start_date")
    end_date = Map.get(params, "end_date")

    with {:ok, start_date} <- Date.from_iso8601(start_date),
         {:ok, end_date} <- Date.from_iso8601(end_date) do
      distribution = Analytics.get_macro_distribution(user.id, start_date, end_date)
      render(conn, "macro_distribution.json", distribution: distribution)
    else
      {:error, :invalid_format} ->
        {:error, :bad_request, "Invalid date format. Use YYYY-MM-DD"}
    end
  end

  def eating_schedule(conn, params) do
    user = conn.assigns.current_user
    days = Map.get(params, "days", "30") |> String.to_integer()

    schedule = Analytics.get_eating_schedule_analysis(user.id, days)
    render(conn, "eating_schedule.json", schedule: schedule)
  end

  def export(conn, params) do
    user = conn.assigns.current_user
    format = Map.get(params, "format", "csv")
    start_date = Map.get(params, "start_date")
    end_date = Map.get(params, "end_date")
    include_graphs = Map.get(params, "include_graphs", false)

    with {:ok, start_date} <- Date.from_iso8601(start_date),
         {:ok, end_date} <- Date.from_iso8601(end_date) do
      case Analytics.export_user_data(user.id, format, start_date, end_date, include_graphs) do
        {:ok, export_data} ->
          render(conn, "export.json", export: export_data)

        {:error, reason} ->
          {:error, reason}
      end
    else
      {:error, :invalid_format} ->
        {:error, :bad_request, "Invalid date format. Use YYYY-MM-DD"}
    end
  end

  def compare(conn, params) do
    user = conn.assigns.current_user
    current_start = Map.get(params, "current_start")
    current_end = Map.get(params, "current_end")
    compare_with = Map.get(params, "compare_with", "previous_period")

    with {:ok, current_start} <- Date.from_iso8601(current_start),
         {:ok, current_end} <- Date.from_iso8601(current_end) do
      comparison =
        Analytics.get_comparative_analytics(user.id, current_start, current_end, compare_with)

      render(conn, "comparative.json", comparison: comparison)
    else
      {:error, :invalid_format} ->
        {:error, :bad_request, "Invalid date format. Use YYYY-MM-DD"}
    end
  end

  def predictions(conn, %{"type" => type} = _params) do
    user = conn.assigns.current_user

    case Analytics.get_ml_predictions(user.id, type) do
      {:ok, predictions} ->
        render(conn, "predictions.json", predictions: predictions)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def streak_analysis(conn, _params) do
    user = conn.assigns.current_user

    streak_data = Analytics.get_streak_analysis(user.id)
    render(conn, "streak.json", streak: streak_data)
  end

  def achievement_progress(conn, _params) do
    user = conn.assigns.current_user

    achievements = Analytics.get_achievement_progress(user.id)
    render(conn, "achievements.json", achievements: achievements)
  end
end
