import Config

# Database configuration for development
config :calai, CalAi.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "calai_dev",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

# Configure the endpoint
config :calai, CalAiWeb.Endpoint,
  # Binding to all interfaces to allow access from mobile devices/emulators
  # Change to `ip: {127, 0, 0, 1}` to restrict to localhost only
  http: [ip: {0, 0, 0, 0}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "development_secret_key_base_replace_in_production",
  watchers: []

# Watch static and templates for browser reloading.
config :calai, CalAiWeb.Endpoint,
  live_reload: [
    patterns: [
      ~r"priv/static/.*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"priv/gettext/.*(po)$",
      ~r"lib/calai_web/(live|views)/.*(ex)$",
      ~r"lib/calai_web/templates/.*(eex)$"
    ]
  ]

# Enable dev routes for dashboard and mailbox
config :calai, dev_routes: true

# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Set a higher stacktrace during development. Avoid configuring such
# in production as building large stacktraces may be expensive.
config :phoenix, :stacktrace_depth, 20

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime

# Disable swoosh api client as it is only required for production adapters.
config :swoosh, :api_client, false

# AI development configuration
config :calai, :ai,
  model_path: "./ai/models",
  inference_timeout: 60_000,
  confidence_threshold: 0.5,
  debug_mode: true

# Redis development configuration
config :calai, :redis,
  host: "localhost",
  port: 6379,
  database: 0
