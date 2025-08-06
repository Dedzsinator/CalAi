defmodule CalAiWeb.Api.V1.ReminderController do
  use CalAiWeb, :controller

  alias CalAi.Reminders
  alias CalAi.Reminders.Reminder

  action_fallback(CalAiWeb.FallbackController)

  def index(conn, _params) do
    user_id = conn.assigns.current_user.id
    reminders = Reminders.list_user_reminders(user_id)
    render(conn, :index, reminders: reminders)
  end

  def create(conn, %{"reminder" => reminder_params}) do
    user_id = conn.assigns.current_user.id
    reminder_params = Map.put(reminder_params, "user_id", user_id)

    with {:ok, %Reminder{} = reminder} <- Reminders.create_reminder(reminder_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/v1/reminders/#{reminder}")
      |> render(:show, reminder: reminder)
    end
  end

  def show(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user.id

    with {:ok, reminder} <- Reminders.get_user_reminder(user_id, id) do
      render(conn, :show, reminder: reminder)
    end
  end

  def update(conn, %{"id" => id, "reminder" => reminder_params}) do
    user_id = conn.assigns.current_user.id

    with {:ok, reminder} <- Reminders.get_user_reminder(user_id, id),
         {:ok, %Reminder{} = reminder} <- Reminders.update_reminder(reminder, reminder_params) do
      render(conn, :show, reminder: reminder)
    end
  end

  def delete(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user.id

    with {:ok, reminder} <- Reminders.get_user_reminder(user_id, id),
         {:ok, %Reminder{}} <- Reminders.delete_reminder(reminder) do
      send_resp(conn, :no_content, "")
    end
  end

  def toggle(conn, %{"id" => id, "is_enabled" => is_enabled}) do
    user_id = conn.assigns.current_user.id

    with {:ok, reminder} <- Reminders.get_user_reminder(user_id, id),
         {:ok, %Reminder{} = reminder} <-
           Reminders.update_reminder(reminder, %{is_enabled: is_enabled}) do
      render(conn, :show, reminder: reminder)
    end
  end

  def today(conn, _params) do
    user_id = conn.assigns.current_user.id
    today = Date.utc_today()
    day_of_week = Date.day_of_week(today) |> day_to_atom()

    reminders = Reminders.get_todays_reminders(user_id, day_of_week)

    render(conn, :index, reminders: reminders)
  end

  def upcoming(conn, _params) do
    user_id = conn.assigns.current_user.id
    current_time = Time.utc_now()
    today = Date.utc_today()
    day_of_week = Date.day_of_week(today) |> day_to_atom()

    reminders = Reminders.get_upcoming_reminders(user_id, day_of_week, current_time, 5)

    render(conn, :index, reminders: reminders)
  end

  def mark_triggered(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user.id

    with {:ok, reminder} <- Reminders.get_user_reminder(user_id, id),
         {:ok, %Reminder{} = reminder} <- Reminders.mark_triggered(reminder) do
      render(conn, :show, reminder: reminder)
    end
  end

  # Helper functions
  defp day_to_atom(day_num) do
    case day_num do
      1 -> :mon
      2 -> :tue
      3 -> :wed
      4 -> :thu
      5 -> :fri
      6 -> :sat
      7 -> :sun
    end
  end
end
