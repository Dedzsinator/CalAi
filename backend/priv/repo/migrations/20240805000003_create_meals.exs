defmodule CalAi.Repo.Migrations.CreateMeals do
  use Ecto.Migration

  def up do
    create table(:meals, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:name, :string)
      add(:meal_type, :string, null: false)
      add(:eaten_at, :naive_datetime, null: false)
      add(:timezone, :string, default: "UTC")
      add(:location, :string)
      add(:notes, :text)
      add(:image_url, :string)
      add(:confidence_score, :float)

      # Calculated nutrition totals
      add(:total_calories, :integer, default: 0, null: false)
      add(:total_protein, :float, default: 0.0, null: false)
      add(:total_carbs, :float, default: 0.0, null: false)
      add(:total_fat, :float, default: 0.0, null: false)
      add(:total_fiber, :float, default: 0.0, null: false)
      add(:total_sugar, :float, default: 0.0, null: false)
      add(:total_sodium, :float, default: 0.0, null: false)

      # Status flags
      add(:is_verified, :boolean, default: false, null: false)
      add(:ai_generated, :boolean, default: false, null: false)
      add(:processing_status, :string, default: "completed", null: false)

      # Foreign keys
      add(:user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false)

      timestamps()
    end

    create(index(:meals, [:user_id]))
    create(index(:meals, [:eaten_at]))
    create(index(:meals, [:meal_type]))
    create(index(:meals, [:user_id, :eaten_at]))
    create(index(:meals, [:processing_status]))

    # Constraint for meal_type
    create(
      constraint(:meals, :valid_meal_type,
        check: "meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')"
      )
    )

    # Constraint for processing_status
    create(
      constraint(:meals, :valid_processing_status,
        check: "processing_status IN ('pending', 'processing', 'completed', 'failed')"
      )
    )
  end

  def down do
    drop(table(:meals))
  end
end
