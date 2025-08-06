defmodule CalAiWeb.Api.V1.NotificationController do
  @moduledoc """
  Controller for managing user notifications and sending test notifications.
  """

  use CalAiWeb, :controller

  require Logger

  action_fallback(CalAiWeb.FallbackController)

  @doc """
  Send a test notification to verify notification setup.

  Expects a POST request with notification type and optional message.
  """
  def test_notification(conn, params) do
    user = conn.assigns.current_user
    notification_type = Map.get(params, "type", "push")
    message = Map.get(params, "message", "This is a test notification from CalAi!")

    Logger.info("Test notification request from user #{user.id}, type: #{notification_type}")

    case send_test_notification(user, notification_type, message) do
      {:ok, result} ->
        conn
        |> put_status(:ok)
        |> render(:test_notification, result: result)

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, error: reason)
    end
  end

  # Private functions

  defp send_test_notification(user, "push", message) do
    # TODO: Implement push notification sending
    # This would involve:
    # 1. Getting user's device tokens
    # 2. Formatting notification payload
    # 3. Sending via Firebase/APNS
    # 4. Tracking delivery status

    Logger.debug("Sending push notification to user #{user.id}: #{message}")

    {:ok,
     %{
       type: "push",
       status: "sent",
       message: message,
       sent_at: DateTime.utc_now(),
       delivery_status: "pending"
     }}
  end

  defp send_test_notification(user, "email", message) do
    # TODO: Implement email notification sending
    # This would involve:
    # 1. Formatting email template
    # 2. Sending via configured email service
    # 3. Tracking delivery status

    Logger.debug("Sending email notification to user #{user.id}: #{message}")

    {:ok,
     %{
       type: "email",
       status: "sent",
       message: message,
       recipient: user.email,
       sent_at: DateTime.utc_now(),
       delivery_status: "pending"
     }}
  end

  defp send_test_notification(_user, type, _message) do
    {:error, "Unsupported notification type: #{type}"}
  end
end
