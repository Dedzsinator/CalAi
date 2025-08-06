defmodule CalAi.Nutrition.MealFood do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "meal_foods" do
    field(:quantity_grams, :float)
    field(:quantity_description, :string)
    field(:confidence_score, :float)
    field(:estimated_portion, :boolean, default: false)
    field(:user_verified, :boolean, default: false)
    field(:ai_detected, :boolean, default: false)
    # For image recognition coordinates
    field(:bounding_box, :map)

    belongs_to(:meal, CalAi.Nutrition.Meal)
    belongs_to(:food, CalAi.Nutrition.Food)

    timestamps()
  end

  @doc false
  def changeset(meal_food, attrs) do
    meal_food
    |> cast(attrs, [
      :quantity_grams,
      :quantity_description,
      :confidence_score,
      :estimated_portion,
      :user_verified,
      :ai_detected,
      :bounding_box,
      :meal_id,
      :food_id
    ])
    |> validate_required([:quantity_grams, :meal_id, :food_id])
    |> validate_number(:quantity_grams, greater_than: 0)
    |> validate_number(:confidence_score, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> foreign_key_constraint(:meal_id)
    |> foreign_key_constraint(:food_id)
  end
end
