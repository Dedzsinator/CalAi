defmodule CalAi.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "users" do
    field(:email, :string)
    field(:password_hash, :string)
    field(:password, :string, virtual: true)
    field(:first_name, :string)
    field(:last_name, :string)
    field(:date_of_birth, :date)
    field(:gender, :string)
    field(:height_cm, :integer)
    field(:weight_kg, :float)
    field(:activity_level, :string)
    field(:goal_type, :string)
    field(:daily_calorie_goal, :integer)
    field(:timezone, :string)
    field(:preferences, :map)
    field(:is_verified, :boolean, default: false)
    field(:is_active, :boolean, default: true)
    field(:last_login_at, :naive_datetime)
    field(:streak_days, :integer, default: 0)
    field(:total_meals_logged, :integer, default: 0)

    has_many(:meals, CalAi.Nutrition.Meal)
    has_many(:user_foods, CalAi.Nutrition.UserFood)
    has_many(:reminders, CalAi.Notifications.Reminder)
    has_many(:analytics, CalAi.Analytics.UserAnalytic)
    has_many(:habits, CalAi.AI.UserHabit)

    timestamps()
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [
      :email,
      :password,
      :first_name,
      :last_name,
      :date_of_birth,
      :gender,
      :height_cm,
      :weight_kg,
      :activity_level,
      :goal_type,
      :daily_calorie_goal,
      :timezone,
      :preferences,
      :is_verified,
      :is_active,
      :streak_days,
      :total_meals_logged
    ])
    |> validate_required([:email, :password, :first_name])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must have the @ sign and no spaces")
    |> validate_length(:email, max: 160)
    |> validate_length(:password, min: 8, max: 72)
    |> validate_inclusion(:gender, ["male", "female", "other", "prefer_not_to_say"])
    |> validate_inclusion(:activity_level, [
      "sedentary",
      "light",
      "moderate",
      "active",
      "very_active"
    ])
    |> validate_inclusion(:goal_type, [
      "lose_weight",
      "maintain_weight",
      "gain_weight",
      "build_muscle"
    ])
    |> validate_number(:height_cm, greater_than: 50, less_than: 300)
    |> validate_number(:weight_kg, greater_than: 20, less_than: 500)
    |> validate_number(:daily_calorie_goal, greater_than: 800, less_than: 5000)
    |> unique_constraint(:email)
    |> hash_password()
  end

  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :password, :first_name, :last_name])
    |> validate_required([:email, :password, :first_name])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must have the @ sign and no spaces")
    |> validate_length(:email, max: 160)
    |> validate_length(:password, min: 8, max: 72)
    |> unique_constraint(:email)
    |> hash_password()
  end

  defp hash_password(changeset) do
    password = get_change(changeset, :password)

    if password && changeset.valid? do
      changeset
      |> put_change(:password_hash, Bcrypt.hash_pwd_salt(password))
      |> delete_change(:password)
    else
      changeset
    end
  end

  def valid_password?(%CalAi.Accounts.User{password_hash: hash}, password)
      when is_binary(hash) and byte_size(password) > 0 do
    Bcrypt.verify_pass(password, hash)
  end

  def valid_password?(_, _) do
    Bcrypt.no_user_verify()
    false
  end
end
