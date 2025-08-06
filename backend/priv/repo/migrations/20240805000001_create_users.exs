defmodule CalAi.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def up do
    create table(:users, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:email, :string, null: false)
      add(:password_hash, :string, null: false)
      add(:first_name, :string, null: false)
      add(:last_name, :string)
      add(:date_of_birth, :date)
      add(:gender, :string)
      add(:height_cm, :integer)
      add(:weight_kg, :float)
      add(:activity_level, :string)
      add(:goal_type, :string)
      add(:daily_calorie_goal, :integer)
      add(:timezone, :string, default: "UTC")
      add(:preferences, :map, default: %{})
      add(:is_verified, :boolean, default: false, null: false)
      add(:is_active, :boolean, default: true, null: false)
      add(:last_login_at, :naive_datetime)
      add(:streak_days, :integer, default: 0, null: false)
      add(:total_meals_logged, :integer, default: 0, null: false)

      timestamps()
    end

    create(unique_index(:users, [:email]))
    create(index(:users, [:is_active]))
    create(index(:users, [:inserted_at]))
  end

  def down do
    drop(table(:users))
  end
end
