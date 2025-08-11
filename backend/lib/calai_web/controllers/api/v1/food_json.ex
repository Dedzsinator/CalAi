defmodule CalAiWeb.Api.V1.FoodJSON do
  alias CalAi.Nutrition.Food

  @doc """
  Renders a list of foods.
  """
  def index(%{foods: foods}) do
    %{data: for(food <- foods, do: data(food))}
  end

  def index(%{
        foods: foods,
        total_count: total_count,
        current_page: current_page,
        total_pages: total_pages
      }) do
    %{
      data: for(food <- foods, do: data(food)),
      meta: %{
        total_count: total_count,
        current_page: current_page,
        total_pages: total_pages
      }
    }
  end

  @doc """
  Renders a single food.
  """
  def show(%{food: food}) do
    %{data: data(food)}
  end

  @doc """
  Renders search results.
  """
  def search(%{foods: foods, query: query, total_count: total_count}) do
    %{
      data: for(food <- foods, do: search_data(food)),
      query: query,
      total_count: total_count,
      success: true
    }
  end

  @doc """
  Renders categories list.
  """
  def categories(%{categories: categories}) do
    %{data: categories}
  end

  @doc """
  Renders bulk search results.
  """
  def bulk_search(%{results: results}) do
    %{data: results}
  end

  @doc """
  Renders barcode lookup result.
  """
  def barcode(%{product: product}) do
    %{
      data: product,
      success: true
    }
  end

  defp data(%Food{} = food) do
    %{
      id: food.id,
      name: food.name,
      description: food.description,
      brand: food.brand,
      category: food.category,
      calories_per_100g: food.calories_per_100g,
      protein_per_100g: food.protein_per_100g,
      carbs_per_100g: food.carbs_per_100g,
      fat_per_100g: food.fat_per_100g,
      fiber_per_100g: food.fiber_per_100g,
      sugar_per_100g: food.sugar_per_100g,
      sodium_per_100g: food.sodium_per_100g,
      barcode: food.barcode,
      verified: food.verified,
      inserted_at: food.inserted_at,
      updated_at: food.updated_at
    }
  end

  defp search_data(food) when is_map(food) do
    # Handle both local Food structs and OpenFoodFacts maps
    cond do
      Map.has_key?(food, :__struct__) and food.__struct__ == CalAi.Nutrition.Food ->
        # Local Food struct
        %{
          id: food.id,
          name: food.name,
          brand: food.brand,
          calories_per_100g: food.calories_per_100g,
          protein_per_100g: food.protein_per_100g,
          carbs_per_100g: food.carbs_per_100g,
          fat_per_100g: food.fat_per_100g
        }

      true ->
        # OpenFoodFacts map or enhanced food data
        %{
          id: Map.get(food, :code) || Map.get(food, "code"),
          name: Map.get(food, :name) || Map.get(food, "name"),
          brand: Map.get(food, :brand) || Map.get(food, "brand"),
          calories_per_100g:
            Map.get(food, :calories_per_100g) || Map.get(food, "calories_per_100g") || 0,
          protein_per_100g:
            Map.get(food, :protein_per_100g) || Map.get(food, "protein_per_100g") || 0,
          carbs_per_100g: Map.get(food, :carbs_per_100g) || Map.get(food, "carbs_per_100g") || 0,
          fat_per_100g: Map.get(food, :fat_per_100g) || Map.get(food, "fat_per_100g") || 0,
          fiber_per_100g: Map.get(food, :fiber_per_100g) || Map.get(food, "fiber_per_100g"),
          sugar_per_100g: Map.get(food, :sugar_per_100g) || Map.get(food, "sugar_per_100g"),
          sodium_per_100g: Map.get(food, :sodium_per_100g) || Map.get(food, "sodium_per_100g"),
          confidence: Map.get(food, :confidence) || Map.get(food, "confidence"),
          image_url: Map.get(food, :image_url) || Map.get(food, "image_url"),
          source: Map.get(food, :source) || Map.get(food, "source") || "unknown"
        }
    end
  end
end
