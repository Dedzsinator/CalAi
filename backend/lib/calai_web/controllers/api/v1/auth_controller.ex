defmodule CalAiWeb.Api.V1.AuthController do
  use CalAiWeb, :controller

  alias CalAi.Accounts
  alias CalAi.Accounts.User
  alias CalAi.Auth.Guardian

  action_fallback(CalAiWeb.FallbackController)

  def register(conn, %{"user" => user_params}) do
    with {:ok, %User{} = user} <- Accounts.create_user(user_params),
         {:ok, token, _claims} <- Guardian.encode_and_sign(user) do
      conn
      |> put_status(:created)
      |> render(:show, %{user: user, token: token})
    end
  end

  def login(conn, %{"email" => email, "password" => password}) do
    case Accounts.authenticate_user(email, password) do
      {:ok, user} ->
        {:ok, token, _claims} = Guardian.encode_and_sign(user)

        # Update last login
        Accounts.update_user_last_login(user)

        conn
        |> put_status(:ok)
        |> render(:show, %{user: user, token: token})

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> render(:error, %{message: "Invalid email or password"})
    end
  end

  def refresh(conn, %{"token" => token}) do
    case Guardian.refresh(token) do
      {:ok, _old_stuff, {new_token, _new_claims}} ->
        conn
        |> put_status(:ok)
        |> render(:token, %{token: new_token})

      {:error, _reason} ->
        conn
        |> put_status(:unauthorized)
        |> render(:error, %{message: "Invalid or expired token"})
    end
  end

  def show(conn, _params) do
    user = Guardian.Plug.current_resource(conn)
    render(conn, :show, %{user: user})
  end
end
