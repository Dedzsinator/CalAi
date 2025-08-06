defmodule CalAi.Nutrition.Meal do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "meals" do
    field(:name, :string)
    field(:meal_type, :string)
    field(:eaten_at, :naive_datetime)
    field(:timezone, :string)
    field(:location, :string)
    field(:notes, :string)
    field(:image_url, :string)
    field(:confidence_score, :float)
    field(:total_calories, :integer)
    field(:total_protein, :float)
    field(:total_carbs, :float)
    field(:total_fat, :float)
    field(:total_fiber, :float)
    field(:total_sugar, :float)
    field(:total_sodium, :float)
    field(:is_verified, :boolean, default: false)
    field(:ai_generated, :boolean, default: false)
    field(:processing_status, :string, default: "completed")

    belongs_to(:user, CalAi.Accounts.User)
    has_many(:meal_foods, CalAi.Nutrition.MealFood, on_delete: :delete_all)
    has_many(:foods, through: [:meal_foods, :food])

    timestamps()
  end

  @doc false
  def changeset(meal, attrs) do
    meal
    |> cast(attrs, [
      :name,
      :meal_type,
      :eaten_at,
      :timezone,
      :location,
      :notes,
      :image_url,
      :confidence_score,
      :total_calories,
      :total_protein,
      :total_carbs,
      :total_fat,
      :total_fiber,
      :total_sugar,
      :total_sodium,
      :is_verified,
      :ai_generated,
      :processing_status,
      :user_id
    ])
    |> validate_required([:meal_type, :eaten_at, :user_id])
    |> validate_inclusion(:meal_type, ["breakfast", "lunch", "dinner", "snack", "other"])
    |> validate_inclusion(:processing_status, ["pending", "processing", "completed", "failed"])
    |> validate_number(:confidence_score, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> validate_number(:total_calories, greater_than_or_equal_to: 0)
    |> foreign_key_constraint(:user_id)
    |> calculate_totals()
  end

  defp calculate_totals(changeset) do
    # This will be called after meal_foods are added
    # For now, we'll let the application handle this
    changeset
  end

  def calculate_nutrition_totals(meal) do
    meal_foods = CalAi.Repo.preload(meal, meal_foods: :food).meal_foods

    totals =
      Enum.reduce(
        meal_foods,
        %{
          calories: 0,
          protein: 0.0,
          carbs: 0.0,
          fat: 0.0,
          fiber: 0.0,
          sugar: 0.0,
          sodium: 0.0
        },
        fn meal_food, acc ->
          food = meal_food.food
          multiplier = meal_food.quantity_grams / 100.0

          %{
            calories: acc.calories + round((food.calories_per_100g || 0) * multiplier),
            protein: acc.protein + (food.protein_per_100g || 0.0) * multiplier,
            carbs: acc.carbs + (food.carbs_per_100g || 0.0) * multiplier,
            fat: acc.fat + (food.fat_per_100g || 0.0) * multiplier,
            fiber: acc.fiber + (food.fiber_per_100g || 0.0) * multiplier,
            sugar: acc.sugar + (food.sugar_per_100g || 0.0) * multiplier,
            sodium: acc.sodium + (food.sodium_per_100g || 0.0) * multiplier
          }
        end
      )

    meal
    |> changeset(%{
      total_calories: totals.calories,
      total_protein: totals.protein,
      total_carbs: totals.carbs,
      total_fat: totals.fat,
      total_fiber: totals.fiber,
      total_sugar: totals.sugar,
      total_sodium: totals.sodium
    })
    |> CalAi.Repo.update()
  end
end
