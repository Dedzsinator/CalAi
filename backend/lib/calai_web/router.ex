defmodule CalAiWeb.Router do
  use CalAiWeb, :router

  import CalAiWeb.UserAuth

  pipeline :api do
    plug(:accepts, ["json"])
    plug(CORSPlug)
  end

  pipeline :authenticated do
    plug(:require_authenticated_user)
  end

  # Public API routes
  scope "/api/v1", CalAiWeb.Api.V1, as: :api_v1 do
    pipe_through(:api)

    # Authentication
    post("/auth/register", AuthController, :register)
    post("/auth/login", AuthController, :login)
    post("/auth/refresh", AuthController, :refresh)

    # Public food database
    get("/foods/search", FoodController, :search)
    post("/foods/barcode", FoodController, :barcode_lookup)

    # AI inference (fallback)
    post("/inference/classify", InferenceController, :classify_food)
    post("/inference/nutrition", InferenceController, :estimate_nutrition)
    post("/inference/ocr", InferenceController, :extract_text)
  end

  # Authenticated API routes
  scope "/api/v1", CalAiWeb.Api.V1, as: :api_v1 do
    pipe_through([:api, :authenticated])

    # User profile
    get("/profile", UserController, :show)
    put("/profile", UserController, :update)
    delete("/profile", UserController, :delete)

    # Meals
    resources "/meals", MealController, except: [:new, :edit] do
      resources("/foods", MealFoodController, except: [:new, :edit])
    end

    # Analytics
    get("/analytics/daily", AnalyticsController, :daily_summary)
    get("/analytics/weekly", AnalyticsController, :weekly_summary)
    get("/analytics/monthly", AnalyticsController, :monthly_summary)
    get("/analytics/trends", AnalyticsController, :trends)
    get("/analytics/habits", AnalyticsController, :habits)

    # Notifications & Reminders
    resources("/reminders", ReminderController, except: [:new, :edit])
    post("/notifications/test", NotificationController, :test_notification)

    # User foods (custom foods created by user)
    resources("/user_foods", UserFoodController, except: [:new, :edit])

    # Data export
    get("/export/meals", ExportController, :meals)
    get("/export/analytics", ExportController, :analytics)

    # Settings
    get("/settings", SettingsController, :show)
    put("/settings", SettingsController, :update)
  end

  # Health check
  scope "/health", CalAiWeb do
    pipe_through(:api)
    get("/", HealthController, :check)
  end

  # Development routes
  if Application.compile_env(:calai, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through([:fetch_session, :protect_from_forgery])

      live_dashboard("/dashboard", metrics: CalAiWeb.Telemetry)
    end
  end
end
