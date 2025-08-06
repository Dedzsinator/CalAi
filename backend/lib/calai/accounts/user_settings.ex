defmodule CalAi.Accounts.UserSettings do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "user_settings" do
    field(:notifications_enabled, :boolean, default: true)
    field(:email_notifications, :boolean, default: true)
    field(:push_notifications, :boolean, default: true)
    field(:reminder_times, {:array, :string}, default: ["08:00", "12:00", "18:00"])
    field(:preferred_units, :string, default: "metric")
    field(:privacy_level, :string, default: "private")
    field(:data_sharing, :boolean, default: false)
    field(:theme, :string, default: "light")
    field(:language, :string, default: "en")
    field(:timezone, :string, default: "UTC")

    belongs_to(:user, CalAi.Accounts.User)

    timestamps()
  end

  @doc false
  def changeset(settings, attrs) do
    settings
    |> cast(attrs, [
      :notifications_enabled,
      :email_notifications,
      :push_notifications,
      :reminder_times,
      :preferred_units,
      :privacy_level,
      :data_sharing,
      :theme,
      :language,
      :timezone,
      :user_id
    ])
    |> validate_inclusion(:preferred_units, ["metric", "imperial"])
    |> validate_inclusion(:privacy_level, ["private", "friends", "public"])
    |> validate_inclusion(:theme, ["light", "dark", "auto"])
  end
end
