defmodule CalAiWeb.Api.V1.UserController do
  use CalAiWeb, :controller

  alias CalAi.{Accounts, Repo}
  alias CalAi.Accounts.User

  action_fallback(CalaiWeb.FallbackController)

  def show(conn, _params) do
    user = conn.assigns.current_user
    render(conn, "show.json", user: user)
  end

  def update(conn, %{"user" => user_params}) do
    user = conn.assigns.current_user

    with {:ok, %User{} = user} <- Accounts.update_user(user, user_params) do
      render(conn, "show.json", user: user)
    end
  end

  def update_profile(conn, %{"profile" => profile_params}) do
    user = conn.assigns.current_user

    with {:ok, %User{} = user} <- Accounts.update_user_profile(user, profile_params) do
      render(conn, "show.json", user: user)
    end
  end

  def settings(conn, _params) do
    user = conn.assigns.current_user
    settings = Accounts.get_user_settings(user.id)
    render(conn, "settings.json", settings: settings)
  end

  def update_settings(conn, %{"settings" => settings_params}) do
    user = conn.assigns.current_user

    case Accounts.update_user_settings(user.id, settings_params) do
      {:ok, settings} ->
        render(conn, "settings.json", settings: settings)

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  def goals(conn, _params) do
    user = conn.assigns.current_user
    goals = Accounts.get_user_goals(user.id)
    render(conn, "goals.json", goals: goals)
  end

  def update_goals(conn, %{"goals" => goals_params}) do
    user = conn.assigns.current_user

    case Accounts.update_user_goals(user.id, goals_params) do
      {:ok, goals} ->
        render(conn, "goals.json", goals: goals)

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  def preferences(conn, _params) do
    user = conn.assigns.current_user
    preferences = Accounts.get_user_preferences(user.id)
    render(conn, "preferences.json", preferences: preferences)
  end

  def update_preferences(conn, %{"preferences" => preferences_params}) do
    user = conn.assigns.current_user

    case Accounts.update_user_preferences(user.id, preferences_params) do
      {:ok, preferences} ->
        render(conn, "preferences.json", preferences: preferences)

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  def notifications(conn, _params) do
    user = conn.assigns.current_user
    notifications = Accounts.get_user_notifications(user.id)
    render(conn, "notifications.json", notifications: notifications)
  end

  def update_notifications(conn, %{"notifications" => notification_params}) do
    user = conn.assigns.current_user

    case Accounts.update_user_notifications(user.id, notification_params) do
      {:ok, notifications} ->
        render(conn, "notifications.json", notifications: notifications)

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  def export_data(conn, params) do
    user = conn.assigns.current_user
    format = Map.get(params, "format", "json")

    case Accounts.export_user_data(user.id, format) do
      {:ok, export_url} ->
        json(conn, %{
          download_url: export_url,
          expires_at: DateTime.utc_now() |> DateTime.add(3600, :second)
        })

      {:error, reason} ->
        {:error, reason}
    end
  end

  def delete_account(conn, %{"password" => password}) do
    user = conn.assigns.current_user

    case Accounts.verify_password(user, password) do
      {:ok, _user} ->
        case Accounts.delete_user_account(user) do
          {:ok, _user} ->
            json(conn, %{success: true, message: "Account deleted successfully"})

          {:error, reason} ->
            {:error, reason}
        end

      {:error, :invalid_password} ->
        {:error, :unauthorized, "Invalid password"}
    end
  end

  def change_password(conn, %{
        "current_password" => current_password,
        "new_password" => new_password
      }) do
    user = conn.assigns.current_user

    case Accounts.change_user_password(user, current_password, new_password) do
      {:ok, _user} ->
        json(conn, %{success: true, message: "Password changed successfully"})

      {:error, :invalid_password} ->
        {:error, :unauthorized, "Current password is incorrect"}

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  def upload_avatar(conn, %{"avatar" => avatar_params}) do
    user = conn.assigns.current_user

    case Accounts.upload_user_avatar(user, avatar_params) do
      {:ok, %User{} = user} ->
        render(conn, "show.json", user: user)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def achievements(conn, _params) do
    user = conn.assigns.current_user
    achievements = Accounts.get_user_achievements(user.id)
    render(conn, "achievements.json", achievements: achievements)
  end

  def activity_log(conn, params) do
    user = conn.assigns.current_user
    page = Map.get(params, "page", "1") |> String.to_integer()
    limit = Map.get(params, "limit", "20") |> String.to_integer()

    activities = Accounts.get_user_activity_log(user.id, %{page: page, limit: limit})
    total_count = Accounts.count_user_activities(user.id)

    render(conn, "activity_log.json", %{
      activities: activities,
      total_count: total_count,
      current_page: page,
      total_pages: ceil(total_count / limit)
    })
  end

  def privacy_settings(conn, _params) do
    user = conn.assigns.current_user
    privacy_settings = Accounts.get_user_privacy_settings(user.id)
    render(conn, "privacy.json", privacy: privacy_settings)
  end

  def update_privacy_settings(conn, %{"privacy" => privacy_params}) do
    user = conn.assigns.current_user

    case Accounts.update_user_privacy_settings(user.id, privacy_params) do
      {:ok, privacy_settings} ->
        render(conn, "privacy.json", privacy: privacy_settings)

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  def subscription(conn, _params) do
    user = conn.assigns.current_user
    subscription = Accounts.get_user_subscription(user.id)
    render(conn, "subscription.json", subscription: subscription)
  end

  def update_subscription(conn, %{"subscription" => subscription_params}) do
    user = conn.assigns.current_user

    case Accounts.update_user_subscription(user.id, subscription_params) do
      {:ok, subscription} ->
        render(conn, "subscription.json", subscription: subscription)

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  def sync_data(conn, %{"data" => sync_data}) do
    user = conn.assigns.current_user

    case Accounts.sync_user_data(user.id, sync_data) do
      {:ok, sync_result} ->
        render(conn, "sync.json", sync: sync_result)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def backup_data(conn, _params) do
    user = conn.assigns.current_user

    case Accounts.create_user_backup(user.id) do
      {:ok, backup_url} ->
        json(conn, %{
          backup_url: backup_url,
          created_at: DateTime.utc_now()
        })

      {:error, reason} ->
        {:error, reason}
    end
  end

  def restore_data(conn, %{"backup_id" => backup_id}) do
    user = conn.assigns.current_user

    case Accounts.restore_user_data(user.id, backup_id) do
      {:ok, restore_result} ->
        render(conn, "restore.json", restore: restore_result)

      {:error, reason} ->
        {:error, reason}
    end
  end
end
