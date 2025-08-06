import Config

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :calai, CalAi.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "calai_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 10

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :calai, CalAiWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "test_secret_key_base",
  server: false

# In test we don't send emails.
config :swoosh, :api_client, false

# Disable swoosh api client as it is only required for production adapters.
config :swoosh, :api_client, false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Configure Oban for testing
config :calai, Oban, testing: :manual

# Configure AI for testing
config :calai, :ai,
  model_path: "./test/fixtures/models",
  inference_timeout: 5_000,
  confidence_threshold: 0.5,
  debug_mode: true

# Configure Redis for testing
config :calai, :redis,
  host: "localhost",
  port: 6379,
  # Use different database for tests
  database: 1
