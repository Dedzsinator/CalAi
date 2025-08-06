defmodule CalAi.Nutrition.Food do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "foods" do
    field(:name, :string)
    field(:brand, :string)
    field(:barcode, :string)
    field(:category, :string)
    field(:subcategory, :string)
    field(:description, :string)

    # Nutritional information per 100g
    field(:calories_per_100g, :integer)
    field(:protein_per_100g, :float)
    field(:carbs_per_100g, :float)
    field(:fat_per_100g, :float)
    field(:fiber_per_100g, :float)
    field(:sugar_per_100g, :float)
    field(:sodium_per_100g, :float)

    # Additional nutrients
    field(:vitamins, :map)
    field(:minerals, :map)
    field(:allergens, {:array, :string})

    # Metadata
    field(:serving_size_g, :float)
    field(:serving_description, :string)
    field(:confidence_score, :float)
    field(:source, :string)
    field(:data_quality, :string)
    field(:image_url, :string)
    field(:verified, :boolean, default: false)

    # Search and ML features
    field(:search_vector, :string)
    field(:embedding, {:array, :float})

    has_many(:meal_foods, CalAi.Nutrition.MealFood)
    has_many(:user_foods, CalAi.Nutrition.UserFood)

    timestamps()
  end

  @doc false
  def changeset(food, attrs) do
    food
    |> cast(attrs, [
      :name,
      :brand,
      :barcode,
      :category,
      :subcategory,
      :description,
      :calories_per_100g,
      :protein_per_100g,
      :carbs_per_100g,
      :fat_per_100g,
      :fiber_per_100g,
      :sugar_per_100g,
      :sodium_per_100g,
      :vitamins,
      :minerals,
      :allergens,
      :serving_size_g,
      :serving_description,
      :confidence_score,
      :source,
      :data_quality,
      :image_url,
      :verified,
      :search_vector,
      :embedding
    ])
    |> validate_required([:name, :calories_per_100g])
    |> validate_length(:name, min: 1, max: 255)
    |> validate_length(:brand, max: 100)
    |> validate_length(:barcode, max: 50)
    |> validate_number(:calories_per_100g, greater_than_or_equal_to: 0)
    |> validate_number(:protein_per_100g, greater_than_or_equal_to: 0)
    |> validate_number(:carbs_per_100g, greater_than_or_equal_to: 0)
    |> validate_number(:fat_per_100g, greater_than_or_equal_to: 0)
    |> validate_number(:confidence_score, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> unique_constraint(:barcode)
    |> generate_search_vector()
  end

  defp generate_search_vector(changeset) do
    name = get_field(changeset, :name)
    brand = get_field(changeset, :brand)
    category = get_field(changeset, :category)

    if name do
      search_text =
        [name, brand, category]
        |> Enum.reject(&is_nil/1)
        |> Enum.join(" ")
        |> String.downcase()

      put_change(changeset, :search_vector, search_text)
    else
      changeset
    end
  end
end
