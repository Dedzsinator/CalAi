defmodule CalAiWeb.HealthController do
  use CalAiWeb, :controller

  def check(conn, _params) do
    json(conn, %{
      status: "ok",
      timestamp: DateTime.utc_now(),
      services: %{
        database: "connected",
        redis: check_redis(),
        api: "running"
      }
    })
  end

  defp check_redis do
    case Redix.command(:redix, ["PING"]) do
      {:ok, "PONG"} -> "connected"
      _ -> "disconnected"
    end
  rescue
    _ -> "disconnected"
  end
end
