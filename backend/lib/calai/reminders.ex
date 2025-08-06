defmodule CalAi.Reminders do
  @moduledoc """
  The Reminders context.
  """

  import Ecto.Query, warn: false
  alias CalAi.Repo
  alias CalAi.Reminders.Reminder

  @doc """
  Returns the list of reminders.

  ## Examples

      iex> list_reminders()
      [%Reminder{}, ...]

  """
  def list_reminders do
    Repo.all(Reminder)
  end

  @doc """
  Gets a single reminder.

  Raises `Ecto.NoResultsError` if the Reminder does not exist.

  ## Examples

      iex> get_reminder!(123)
      %Reminder{}

      iex> get_reminder!(456)
      ** (Ecto.NoResultsError)

  """
  def get_reminder!(id), do: Repo.get!(Reminder, id)

  @doc """
  Gets a single reminder.

  ## Examples

      iex> get_reminder(123)
      %Reminder{}

      iex> get_reminder(456)
      nil

  """
  def get_reminder(id), do: Repo.get(Reminder, id)

  @doc """
  Creates a reminder.

  ## Examples

      iex> create_reminder(%{field: value})
      {:ok, %Reminder{}}

      iex> create_reminder(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_reminder(attrs \\ %{}) do
    %Reminder{}
    |> Reminder.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a reminder.

  ## Examples

      iex> update_reminder(reminder, %{field: new_value})
      {:ok, %Reminder{}}

      iex> update_reminder(reminder, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_reminder(%Reminder{} = reminder, attrs) do
    reminder
    |> Reminder.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a reminder.

  ## Examples

      iex> delete_reminder(reminder)
      {:ok, %Reminder{}}

      iex> delete_reminder(reminder)
      {:error, %Ecto.Changeset{}}

  """
  def delete_reminder(%Reminder{} = reminder) do
    Repo.delete(reminder)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking reminder changes.

  ## Examples

      iex> change_reminder(reminder)
      %Ecto.Changeset{data: %Reminder{}}

  """
  def change_reminder(%Reminder{} = reminder, attrs \\ %{}) do
    Reminder.changeset(reminder, attrs)
  end

  # Additional functions required by controllers

  @doc """
  Gets reminders for a specific user.
  """
  def list_user_reminders(user_id) do
    from(r in Reminder, where: r.user_id == ^user_id, order_by: [asc: r.time])
    |> Repo.all()
  end

  @doc """
  Gets a single reminder for a specific user.
  """
  def get_user_reminder(user_id, reminder_id) do
    case Repo.get_by(Reminder, id: reminder_id, user_id: user_id) do
      nil -> {:error, :not_found}
      reminder -> {:ok, reminder}
    end
  end

  @doc """
  Gets today's reminders for a user based on day of week.
  """
  def get_todays_reminders(user_id, day_of_week) do
    from(r in Reminder,
      where:
        r.user_id == ^user_id and
          r.is_active == true and
          ^day_of_week in r.days_of_week,
      order_by: [asc: r.time]
    )
    |> Repo.all()
  end

  @doc """
  Gets upcoming reminders for a user within a time window.
  """
  def get_upcoming_reminders(user_id, day_of_week, current_time, limit \\ 5) do
    from(r in Reminder,
      where:
        r.user_id == ^user_id and
          r.is_active == true and
          ^day_of_week in r.days_of_week and
          r.time >= ^current_time,
      order_by: [asc: r.time],
      limit: ^limit
    )
    |> Repo.all()
  end

  @doc """
  Mark a reminder as triggered.
  """
  def mark_triggered(%Reminder{} = reminder) do
    now = DateTime.utc_now()

    update_reminder(reminder, %{
      last_triggered_at: now,
      trigger_count: (reminder.trigger_count || 0) + 1
    })
  end
end
