defmodule CalAi.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Telemetry
      CalAiWeb.Telemetry,

      # Database
      CalAi.Repo,

      # Redis
      {Redix, host: redis_host(), port: redis_port(), name: :redix},

      # PubSub
      {Phoenix.PubSub, name: CalAi.PubSub},

      # Background Jobs
      {Oban, Application.fetch_env!(:calai, Oban)},

      # Web Endpoint
      CalAiWeb.Endpoint,

      # AI Services
      CalAi.AI.InferenceServer,
      CalAi.Services.FoodDatabase,
      CalAi.Services.NutritionAnalyzer,

      # Schedulers
      CalAi.Schedulers.ReminderScheduler,
      CalAi.Schedulers.DataSyncScheduler
    ]

    opts = [strategy: :one_for_one, name: CalAi.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    CalAiWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  defp redis_host do
    System.get_env("REDIS_HOST", "localhost")
  end

  defp redis_port do
    System.get_env("REDIS_PORT", "6379") |> String.to_integer()
  end
end
