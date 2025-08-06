defmodule CalAi.Repo.Migrations.CreateMealFoods do
  use Ecto.Migration

  def up do
    create table(:meal_foods, primary_key: false) do
      add(:id, :binary_id, primary_key: true)
      add(:quantity_grams, :float, null: false)
      add(:quantity_description, :string)
      add(:confidence_score, :float)
      add(:estimated_portion, :boolean, default: false, null: false)
      add(:user_verified, :boolean, default: false, null: false)
      add(:ai_detected, :boolean, default: false, null: false)
      # {x, y, width, height} for image coordinates
      add(:bounding_box, :map)

      # Foreign keys
      add(:meal_id, references(:meals, type: :binary_id, on_delete: :delete_all), null: false)
      add(:food_id, references(:foods, type: :binary_id, on_delete: :restrict), null: false)

      timestamps()
    end

    create(index(:meal_foods, [:meal_id]))
    create(index(:meal_foods, [:food_id]))
    create(index(:meal_foods, [:ai_detected]))
    create(index(:meal_foods, [:user_verified]))

    # Constraint for positive quantity
    create(constraint(:meal_foods, :positive_quantity, check: "quantity_grams > 0"))
  end

  def down do
    drop(table(:meal_foods))
  end
end
