defmodule CalAi.Accounts do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias CalAi.Repo
  alias CalAi.Accounts.User

  @doc """
  Gets a single user.

  Raises `Ecto.NoResultsError` if the User does not exist.

  ## Examples

      iex> get_user!(123)
      %User{}

      iex> get_user!(456)
      ** (Ecto.NoResultsError)

  """
  def get_user!(id), do: Repo.get!(User, id)

  @doc """
  Gets a single user.

  Returns nil if the User does not exist.

  ## Examples

      iex> get_user(123)
      %User{}

      iex> get_user(456)
      nil

  """
  def get_user(id), do: Repo.get(User, id)

  @doc """
  Gets a user by email.

  ## Examples

      iex> get_user_by_email("user@example.com")
      %User{}

      iex> get_user_by_email("unknown@example.com")
      nil

  """
  def get_user_by_email(email) when is_binary(email) do
    Repo.get_by(User, email: email)
  end

  @doc """
  Creates a user.

  ## Examples

      iex> create_user(%{field: value})
      {:ok, %User{}}

      iex> create_user(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_user(attrs \\ %{}) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a user.

  ## Examples

      iex> update_user(user, %{field: new_value})
      {:ok, %User{}}

      iex> update_user(user, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a user.

  ## Examples

      iex> delete_user(user)
      {:ok, %User{}}

      iex> delete_user(user)
      {:error, %Ecto.Changeset{}}

  """
  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user changes.

  ## Examples

      iex> change_user(user)
      %Ecto.Changeset{data: %User{}}

  """
  def change_user(%User{} = user, attrs \\ %{}) do
    User.changeset(user, attrs)
  end

  @doc """
  Authenticates a user by email and password.

  ## Examples

      iex> authenticate_user("user@example.com", "password")
      {:ok, %User{}}

      iex> authenticate_user("user@example.com", "wrong_password")
      {:error, :invalid_credentials}

  """
  def authenticate_user(email, password) when is_binary(email) and is_binary(password) do
    user = get_user_by_email(email)

    cond do
      user && User.valid_password?(user, password) ->
        {:ok, user}

      user ->
        # User exists but password is wrong
        Bcrypt.no_user_verify()
        {:error, :invalid_credentials}

      true ->
        # User does not exist
        Bcrypt.no_user_verify()
        {:error, :invalid_credentials}
    end
  end

  # User Settings functions

  alias CalAi.Accounts.UserSettings

  @doc """
  Gets user settings by user ID.

  ## Examples

      iex> get_user_settings(123)
      %UserSettings{}

      iex> get_user_settings(456)
      nil

  """
  def get_user_settings(user_id) do
    Repo.get_by(UserSettings, user_id: user_id)
  end

  @doc """
  Creates user settings.

  ## Examples

      iex> create_user_settings(%{field: value})
      {:ok, %UserSettings{}}

      iex> create_user_settings(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_user_settings(attrs \\ %{}) do
    %UserSettings{}
    |> UserSettings.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates user settings.

  ## Examples

      iex> update_user_settings(settings, %{field: new_value})
      {:ok, %UserSettings{}}

      iex> update_user_settings(settings, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_user_settings(%UserSettings{} = settings, attrs) do
    settings
    |> UserSettings.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes user settings.

  ## Examples

      iex> delete_user_settings(settings)
      {:ok, %UserSettings{}}

      iex> delete_user_settings(settings)
      {:error, %Ecto.Changeset{}}

  """
  def delete_user_settings(%UserSettings{} = settings) do
    Repo.delete(settings)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user settings changes.

  ## Examples

      iex> change_user_settings(settings)
      %Ecto.Changeset{data: %UserSettings{}}

  """
  def change_user_settings(%UserSettings{} = settings, attrs \\ %{}) do
    UserSettings.changeset(settings, attrs)
  end
end
