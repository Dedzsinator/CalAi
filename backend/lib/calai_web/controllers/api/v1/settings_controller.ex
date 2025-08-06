defmodule CalAiWeb.Api.V1.SettingsController do
  use CalAiWeb, :controller

  alias CalAi.Accounts
  alias CalAi.Accounts.UserSettings
  alias CalAi.Repo

  import Ecto.Query

  action_fallback(CalaiWeb.FallbackController)

  def show(conn, _params) do
    user_id = conn.assigns.current_user.id

    case Accounts.get_user_settings(user_id) do
      %UserSettings{} = settings ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, data: settings})

      nil ->
        # Create default settings if they don't exist
        default_settings = %{
          user_id: user_id,
          units: "metric",
          theme: "auto",
          notifications: %{
            meal_reminders: true,
            habit_insights: true,
            weekly_reports: true,
            push_notifications: true
          },
          privacy: %{
            share_data: false,
            analytics_opt_out: false
          },
          diet: %{
            restrictions: [],
            allergies: [],
            cuisine_preferences: []
          }
        }

        case Accounts.create_user_settings(default_settings) do
          {:ok, settings} ->
            conn
            |> put_status(:ok)
            |> json(%{success: true, data: settings})

          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              success: false,
              message: "Failed to create default settings",
              errors: format_changeset_errors(changeset)
            })
        end
    end
  end

  def update(conn, params) do
    user_id = conn.assigns.current_user.id

    case Accounts.get_user_settings(user_id) do
      %UserSettings{} = settings ->
        case Accounts.update_user_settings(settings, params) do
          {:ok, updated_settings} ->
            conn
            |> put_status(:ok)
            |> json(%{success: true, data: updated_settings})

          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              success: false,
              message: "Failed to update settings",
              errors: format_changeset_errors(changeset)
            })
        end

      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{success: false, message: "Settings not found"})
    end
  end

  def update_notifications(conn, %{"notifications" => notifications_params}) do
    user_id = conn.assigns.current_user.id

    case Accounts.get_user_settings(user_id) do
      %UserSettings{} = settings ->
        current_notifications = settings.notifications || %{}
        updated_notifications = Map.merge(current_notifications, notifications_params)

        case Accounts.update_user_settings(settings, %{notifications: updated_notifications}) do
          {:ok, updated_settings} ->
            conn
            |> put_status(:ok)
            |> json(%{success: true, data: updated_settings.notifications})

          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              success: false,
              message: "Failed to update notification settings",
              errors: format_changeset_errors(changeset)
            })
        end

      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{success: false, message: "Settings not found"})
    end
  end

  def update_privacy(conn, %{"privacy" => privacy_params}) do
    user_id = conn.assigns.current_user.id

    case Accounts.get_user_settings(user_id) do
      %UserSettings{} = settings ->
        current_privacy = settings.privacy || %{}
        updated_privacy = Map.merge(current_privacy, privacy_params)

        case Accounts.update_user_settings(settings, %{privacy: updated_privacy}) do
          {:ok, updated_settings} ->
            conn
            |> put_status(:ok)
            |> json(%{success: true, data: updated_settings.privacy})

          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              success: false,
              message: "Failed to update privacy settings",
              errors: format_changeset_errors(changeset)
            })
        end

      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{success: false, message: "Settings not found"})
    end
  end

  def update_diet(conn, %{"diet" => diet_params}) do
    user_id = conn.assigns.current_user.id

    case Accounts.get_user_settings(user_id) do
      %UserSettings{} = settings ->
        current_diet = settings.diet || %{}
        updated_diet = Map.merge(current_diet, diet_params)

        case Accounts.update_user_settings(settings, %{diet: updated_diet}) do
          {:ok, updated_settings} ->
            conn
            |> put_status(:ok)
            |> json(%{success: true, data: updated_settings.diet})

          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              success: false,
              message: "Failed to update diet settings",
              errors: format_changeset_errors(changeset)
            })
        end

      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{success: false, message: "Settings not found"})
    end
  end

  def reset(conn, _params) do
    user_id = conn.assigns.current_user.id

    case Accounts.get_user_settings(user_id) do
      %UserSettings{} = settings ->
        default_settings = %{
          units: "metric",
          theme: "auto",
          notifications: %{
            meal_reminders: true,
            habit_insights: true,
            weekly_reports: true,
            push_notifications: true
          },
          privacy: %{
            share_data: false,
            analytics_opt_out: false
          },
          diet: %{
            restrictions: [],
            allergies: [],
            cuisine_preferences: []
          }
        }

        case Accounts.update_user_settings(settings, default_settings) do
          {:ok, updated_settings} ->
            conn
            |> put_status(:ok)
            |> json(%{
              success: true,
              data: updated_settings,
              message: "Settings reset to defaults"
            })

          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{
              success: false,
              message: "Failed to reset settings",
              errors: format_changeset_errors(changeset)
            })
        end

      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{success: false, message: "Settings not found"})
    end
  end

  def export_data(conn, _params) do
    user_id = conn.assigns.current_user.id

    # Create a job for data export
    job_params = %{
      user_id: user_id,
      job_type: "data_export",
      parameters: %{
        format: "json",
        include_images: false
      },
      priority: 3
    }

    case CalAi.Jobs.create_job(job_params) do
      {:ok, job} ->
        # Queue the export job
        CalAi.Jobs.queue_data_export_job(job)

        conn
        |> put_status(:accepted)
        |> json(%{
          success: true,
          data: %{
            job_id: job.id,
            status: job.status,
            message: "Data export started. You'll receive an email when it's ready."
          }
        })

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          success: false,
          message: "Failed to start data export",
          errors: format_changeset_errors(changeset)
        })
    end
  end

  def delete_account(conn, %{"confirmation" => "DELETE"}) do
    user_id = conn.assigns.current_user.id

    # Create a job for account deletion
    job_params = %{
      user_id: user_id,
      job_type: "account_deletion",
      parameters: %{
        delete_immediately: false,
        retention_days: 30
      },
      priority: 1
    }

    case CalAi.Jobs.create_job(job_params) do
      {:ok, job} ->
        # Queue the deletion job
        CalAi.Jobs.queue_account_deletion_job(job)

        conn
        |> put_status(:accepted)
        |> json(%{
          success: true,
          data: %{
            job_id: job.id,
            message: "Account deletion scheduled. You have 30 days to cancel this action."
          }
        })

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          success: false,
          message: "Failed to schedule account deletion",
          errors: format_changeset_errors(changeset)
        })
    end
  end

  def delete_account(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{
      success: false,
      message: "To delete your account, you must provide confirmation: 'DELETE'"
    })
  end

  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
