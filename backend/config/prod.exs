import Config

# Database configuration for production
database_url =
  System.get_env("DATABASE_URL") ||
    raise """
    environment variable DATABASE_URL is missing.
    For example: ecto://USER:PASS@HOST/DATABASE
    """

maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

config :calai, CalAi.Repo,
  url: database_url,
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
  socket_options: maybe_ipv6

# The secret key base is used to sign/encrypt cookies and other secrets.
# A default value is used in config/dev.exs and config/test.exs but you
# want to use a different value for prod and you most likely don't want
# to check this value into version control, so we use an environment
# variable instead.
secret_key_base =
  System.get_env("SECRET_KEY_BASE") ||
    raise """
    environment variable SECRET_KEY_BASE is missing.
    You can generate one by calling: mix phx.gen.secret
    """

host = System.get_env("PHX_HOST") || "example.com"
port = String.to_integer(System.get_env("PORT") || "4000")

config :calai, CalAiWeb.Endpoint,
  url: [host: host, port: 443, scheme: "https"],
  http: [
    # Enable IPv6 and bind on all interfaces.
    # Set it to  {0, 0, 0, 0, 0, 0, 0, 1} for local network only access.
    # See the documentation on https://hexdocs.pm/plug_cowboy/Plug.Cowboy.html
    # for details about using IPv6 vs IPv4 and loopback vs public addresses.
    ip: {0, 0, 0, 0, 0, 0, 0, 0},
    port: port
  ],
  secret_key_base: secret_key_base,
  force_ssl: [rewrite_on: [:x_forwarded_proto]],
  check_origin: [
    "//#{host}",
    "//www.#{host}"
  ]

# Configures Swoosh API Client
config :swoosh, api_client: Swoosh.ApiClient.Finch, finch_name: CalAi.Finch

# Runtime production config, including reading
# of environment variables, is done on config/runtime.exs.

# Configure error reporting
config :sentry,
  dsn: System.get_env("SENTRY_DSN"),
  environment_name: :prod,
  enable_source_code_context: true,
  root_source_code_paths: [File.cwd!()]

# Configure production AI settings
config :calai, :ai,
  model_path: System.get_env("AI_MODEL_PATH", "/app/models"),
  inference_timeout: 30_000,
  confidence_threshold: 0.8,
  debug_mode: false

# Configure production Redis
config :calai, :redis, url: System.get_env("REDIS_URL", "redis://localhost:6379/0")

# Configure production CORS
config :cors_plug,
  origin: [System.get_env("FRONTEND_URL", "https://calai.app")],
  max_age: 86400,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
