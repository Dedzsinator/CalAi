defmodule CalAiWeb.UserAuth do
  @moduledoc """
  Authentication plug for verifying user tokens.
  """

  import Plug.Conn
  import Phoenix.Controller

  def init(opts), do: opts

  def call(conn, _opts) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] ->
        case verify_token(token) do
          {:ok, user} ->
            assign(conn, :current_user, user)
          {:error, _reason} ->
            conn
            |> put_status(:unauthorized)
            |> put_view(json: CalAiWeb.ErrorJSON)
            |> render(:unauthorized)
            |> halt()
        end
      _ ->
        conn
        |> put_status(:unauthorized)
        |> put_view(json: CalAiWeb.ErrorJSON)
        |> render(:unauthorized)
        |> halt()
    end
  end

  def require_authenticated_user(conn, _opts) do
    if conn.assigns[:current_user] do
      conn
    else
      conn
      |> put_status(:unauthorized)
      |> put_view(json: CalAiWeb.ErrorJSON)
      |> render(:unauthorized)
      |> halt()
    end
  end

  defp verify_token(token) do
    case Guardian.decode_and_verify(CalAi.Auth.Guardian, token) do
      {:ok, claims} ->
        case Guardian.resource_from_claims(CalAi.Auth.Guardian, claims) do
          {:ok, user} -> {:ok, user}
          error -> error
        end
      error -> error
    end
  end
end
