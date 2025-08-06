defmodule CalAiWeb.Api.V1.NotificationJSON do
  @moduledoc """
  JSON views for notification operations.
  """

  @doc """
  Renders test notification results.
  """
  def test_notification(%{result: result}) do
    %{
      success: true,
      data: %{
        type: result.type,
        status: result.status,
        message: result.message,
        sent_at: result.sent_at,
        delivery_status: result.delivery_status,
        recipient: Map.get(result, :recipient)
      }
    }
  end

  @doc """
  Renders notification errors.
  """
  def error(%{error: error}) when is_binary(error) do
    %{
      success: false,
      error: %{
        message: error,
        type: "notification_error"
      }
    }
  end
end
