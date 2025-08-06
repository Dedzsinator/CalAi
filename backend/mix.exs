defmodule CalAi.MixProject do
  use Mix.Project

  def project do
    [
      app: :calai,
      version: "0.1.0",
      elixir: "~> 1.14",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  def application do
    [
      mod: {CalAi.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      # Phoenix
      {:phoenix, "~> 1.7.0"},
      {:phoenix_ecto, "~> 4.4"},
      {:phoenix_live_dashboard, "~> 0.7.2"},
      {:telemetry_metrics, "~> 0.6"},
      {:telemetry_poller, "~> 1.0"},
      {:jason, "~> 1.2"},
      {:plug_cowboy, "~> 2.5"},

      # Database
      {:ecto_sql, "~> 3.6"},
      {:postgrex, ">= 0.0.0"},

      # Redis
      {:redix, "~> 1.1"},

      # Background Jobs
      {:oban, "~> 2.15"},

      # HTTP Client
      {:req, "~> 0.4.0"},
      {:httpoison, "~> 2.0"},

      # Authentication & Security
      {:guardian, "~> 2.3"},
      {:bcrypt_elixir, "~> 3.0"},
      {:cors_plug, "~> 3.0"},

      # Internationalization
      {:gettext, "~> 0.20"},

      # Image Processing
      {:image, "~> 0.37"},
      {:mogrify, "~> 0.9.0"},

      # Machine Learning Integration
      {:nx, "~> 0.6"},
      {:axon, "~> 0.6"},
      {:ortex, "~> 0.1.7"},

      # Data Processing
      {:csv, "~> 3.0"},
      {:decimal, "~> 2.0"},

      # Monitoring & Logging
      {:logger_json, "~> 5.1"},

      # Development & Testing
      {:phoenix_live_reload, "~> 1.2", only: :dev},
      {:ex_machina, "~> 2.7.0", only: [:test, :dev]},
      {:credo, "~> 1.6", only: [:dev, :test], runtime: false},
      {:dialyxir, "~> 1.0", only: [:dev], runtime: false},
      {:excoveralls, "~> 0.10", only: :test},
      {:floki, ">= 0.30.0", only: :test}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "ecto.setup"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"]
    ]
  end
end
