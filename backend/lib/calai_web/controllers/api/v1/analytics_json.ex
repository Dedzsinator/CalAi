defmodule CalAiWeb.Api.V1.AnalyticsJSON do
  @doc """
  Renders analytics data.
  """
  def analytics(%{analytics: analytics}) do
    %{
      data: %{
        calories: %{
          avg: Map.get(analytics, :avg_calories, 0),
          total: Map.get(analytics, :total_calories, 0),
          trend: Map.get(analytics, :calorie_trend, [])
        },
        macros: %{
          protein: Map.get(analytics, :protein_percent, 0),
          carbs: Map.get(analytics, :carbs_percent, 0),
          fat: Map.get(analytics, :fat_percent, 0)
        },
        habits: %{
          meal_times: Map.get(analytics, :meal_times, []),
          common_foods: Map.get(analytics, :common_foods, [])
        }
      },
      success: true
    }
  end

  @doc """
  Renders trends data.
  """
  def trends(%{trends: trends}) do
    %{
      data: trends,
      success: true
    }
  end

  @doc """
  Renders nutrition breakdown.
  """
  def nutrition_breakdown(%{breakdown: breakdown}) do
    %{
      data: breakdown,
      success: true
    }
  end
end
