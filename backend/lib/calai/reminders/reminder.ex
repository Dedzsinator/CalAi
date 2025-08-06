defmodule CalAi.Reminders.Reminder do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "reminders" do
    field(:title, :string)
    field(:message, :string)
    field(:reminder_type, :string)
    field(:scheduled_at, :naive_datetime)
    field(:sent_at, :naive_datetime)
    field(:is_active, :boolean, default: true)
    field(:repeat_pattern, :string)
    field(:repeat_days, {:array, :string}, default: [])
    field(:timezone, :string)

    belongs_to(:user, CalAi.Accounts.User)

    timestamps()
  end

  @doc false
  def changeset(reminder, attrs) do
    reminder
    |> cast(attrs, [
      :title,
      :message,
      :reminder_type,
      :scheduled_at,
      :sent_at,
      :is_active,
      :repeat_pattern,
      :repeat_days,
      :timezone,
      :user_id
    ])
    |> validate_required([:title, :reminder_type, :scheduled_at, :user_id])
    |> validate_inclusion(:reminder_type, ["meal", "water", "exercise", "weight", "custom"])
    |> validate_inclusion(:repeat_pattern, ["none", "daily", "weekly", "monthly", "custom"])
  end
end
