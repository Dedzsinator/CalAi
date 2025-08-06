defmodule CalAi.Jobs.MorningReminderJob do
  @moduledoc """
  Oban job for sending morning meal reminder notifications to users.
  Scheduled to run daily at 8:00 AM via cron configuration.
  """

  use Oban.Worker, queue: :notifications, max_attempts: 3
  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    Logger.info("Running MorningReminderJob with args: #{inspect(args)}")

    try do
      # Get all users with morning reminders enabled
      users_with_morning_reminders = get_users_with_morning_reminders()

      # Send morning reminders to each user
      Enum.each(users_with_morning_reminders, &send_morning_reminder/1)

      Logger.info("MorningReminderJob completed successfully")
      :ok
    catch
      kind, reason ->
        Logger.error("MorningReminderJob failed - #{kind}: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp get_users_with_morning_reminders do
    # Placeholder implementation
    # In a real implementation, this would query the database for:
    # - Users who have morning reminders enabled in their settings
    # - Users who haven't logged their breakfast yet today
    # - Users in timezones where it's currently morning (8 AM)

    Logger.debug("Fetching users with morning reminders enabled")
    []
  end

  defp send_morning_reminder(user) do
    # Placeholder implementation
    # In a real implementation, this would:
    # - Generate personalized reminder message
    # - Send push notification via Firebase/APNS
    # - Send email notification if enabled
    # - Log the reminder in the database

    Logger.debug("Sending morning reminder to user: #{user.id}")
  end
end
