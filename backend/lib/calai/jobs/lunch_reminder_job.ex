defmodule CalAi.Jobs.LunchReminderJob do
  @moduledoc """
  Oban job for sending lunch meal reminder notifications to users.
  Scheduled to run daily at 12:00 PM via cron configuration.
  """

  use Oban.Worker, queue: :notifications, max_attempts: 3
  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    Logger.info("Running LunchReminderJob with args: #{inspect(args)}")

    try do
      # Get all users with lunch reminders enabled
      users_with_lunch_reminders = get_users_with_lunch_reminders()

      # Send lunch reminders to each user
      Enum.each(users_with_lunch_reminders, &send_lunch_reminder/1)

      Logger.info("LunchReminderJob completed successfully")
      :ok
    catch
      kind, reason ->
        Logger.error("LunchReminderJob failed - #{kind}: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp get_users_with_lunch_reminders do
    # Placeholder implementation
    # In a real implementation, this would query the database for:
    # - Users who have lunch reminders enabled in their settings
    # - Users who haven't logged their lunch yet today
    # - Users in timezones where it's currently around lunch time (12 PM)

    Logger.debug("Fetching users with lunch reminders enabled")
    []
  end

  defp send_lunch_reminder(user) do
    # Placeholder implementation
    # In a real implementation, this would:
    # - Generate personalized reminder message
    # - Send push notification via Firebase/APNS
    # - Send email notification if enabled
    # - Log the reminder in the database

    Logger.debug("Sending lunch reminder to user: #{user.id}")
  end
end
