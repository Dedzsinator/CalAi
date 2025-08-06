import Config

# Database configuration
config :calai, CalAi.Repo,
  username: System.get_env("POSTGRES_USER", "postgres"),
  password: System.get_env("POSTGRES_PASSWORD", "postgres"),
  hostname: System.get_env("POSTGRES_HOST", "localhost"),
  database: System.get_env("POSTGRES_DB", "calai_dev"),
  port: System.get_env("POSTGRES_PORT", "5432") |> String.to_integer(),
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

# Configure the web endpoint
config :calai, CalAiWeb.Endpoint,
  url: [host: System.get_env("PHX_HOST", "localhost")],
  http: [ip: {0, 0, 0, 0}, port: System.get_env("PHX_PORT", "4000") |> String.to_integer()],
  render_errors: [view: CalAiWeb.ErrorView, accepts: ~w(json), layout: false],
  pubsub_server: CalAi.PubSub,
  live_view: [signing_salt: System.get_env("SECRET_KEY_BASE", "secret")],
  secret_key_base: System.get_env("SECRET_KEY_BASE", "secret"),
  server: true

# Configure Ecto repositories
config :calai,
  ecto_repos: [CalAi.Repo]

# Configure JSON library
config :phoenix, :json_library, Jason

# Configure CORS
config :cors_plug,
  origin: ["http://localhost:3000", "http://localhost:8081", ~r/^https?:\/\/.*\.ngrok\.io$/],
  max_age: 86400,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]

# Configure Guardian (JWT)
config :calai, CalAi.Auth.Guardian,
  issuer: "calai",
  secret_key: System.get_env("GUARDIAN_SECRET_KEY", "secret"),
  ttl: {30, :days}

# Configure Oban (Background Jobs)
config :calai, Oban,
  repo: CalAi.Repo,
  plugins: [
    Oban.Plugins.Pruner,
    {Oban.Plugins.Cron,
     crontab: [
       {"0 8 * * *", CalAi.Jobs.MorningReminderJob},
       {"0 12 * * *", CalAi.Jobs.LunchReminderJob},
       {"0 18 * * *", CalAi.Jobs.DinnerReminderJob},
       {"0 2 * * *", CalAi.Jobs.DataSyncJob}
     ]}
  ],
  queues: [
    default: 10,
    ai_inference: 5,
    notifications: 20,
    data_sync: 3
  ]

# Configure AI services
config :calai, :ai,
  model_path: System.get_env("AI_MODEL_PATH", "./models"),
  inference_timeout: 30_000,
  fallback_api_url: System.get_env("AI_FALLBACK_URL", "http://localhost:8000"),
  confidence_threshold: 0.7

# Configure external APIs
config :calai, :external_apis,
  food_api_key: System.get_env("FOOD_API_KEY"),
  huggingface_api_key: System.get_env("HUGGINGFACE_API_KEY"),
  openfoodfacts_url: "https://world.openfoodfacts.org/api/v0"

# Configure image processing
config :calai, :image_processing,
  # 10MB
  max_file_size: 10 * 1024 * 1024,
  allowed_formats: ~w(jpg jpeg png webp),
  resize_dimensions: %{
    thumbnail: {150, 150},
    medium: {400, 400},
    large: {800, 800}
  }

# Configure Redis
config :calai, :redis,
  host: System.get_env("REDIS_HOST", "localhost"),
  port: System.get_env("REDIS_PORT", "6379") |> String.to_integer(),
  database: System.get_env("REDIS_DB", "0") |> String.to_integer()

# Configure logging
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id, :user_id, :correlation_id]

# Import environment specific config
import_config "#{config_env()}.exs"
