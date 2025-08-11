defmodule CalAiWeb.Api.V1.FoodController do
  use CalAiWeb, :controller

  alias CalAi.{Nutrition, Repo, Cache}
  alias CalAi.Nutrition.Food
  alias CalAi.Services.OpenFoodFacts

  action_fallback(CalAiWeb.FallbackController)

  def index(conn, params) do
    page = Map.get(params, "page", "1") |> String.to_integer()
    limit = Map.get(params, "limit", "20") |> String.to_integer()
    category = Map.get(params, "category")

    foods = Nutrition.list_foods(%{page: page, limit: limit, category: category})
    total_count = Nutrition.count_foods(category)

    render(conn, "index.json", %{
      foods: foods,
      total_count: total_count,
      current_page: page,
      total_pages: ceil(total_count / limit)
    })
  end

  def show(conn, %{"id" => id}) do
    case Nutrition.get_food(id) do
      nil -> {:error, :not_found}
      food -> render(conn, "show.json", food: food)
    end
  end

  def create(conn, %{"food" => food_params}) do
    user = conn.assigns.current_user

    food_params = Map.put(food_params, "user_id", user.id)

    with {:ok, %Food{} = food} <- Nutrition.create_food(food_params) do
      conn
      |> put_status(:created)
      |> render("show.json", food: food)
    end
  end

  def update(conn, %{"id" => id, "food" => food_params}) do
    user = conn.assigns.current_user
    food = Nutrition.get_food!(id)

    # Only allow updates if user owns the food or is admin
    if food.user_id == user.id or user.role == "admin" do
      with {:ok, %Food{} = food} <- Nutrition.update_food(food, food_params) do
        render(conn, "show.json", food: food)
      end
    else
      {:error, :forbidden}
    end
  end

  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    food = Nutrition.get_food!(id)

    if food.user_id == user.id or user.role == "admin" do
      with {:ok, %Food{}} <- Nutrition.delete_food(food) do
        send_resp(conn, :no_content, "")
      end
    else
      {:error, :forbidden}
    end
  end

  def search(conn, %{"q" => query} = params) do
    limit = Map.get(params, "limit", "20") |> String.to_integer()
    category = Map.get(params, "category")

    # Search local database first
    local_foods = Nutrition.search_foods(query, %{limit: limit, category: category})

    # If we have local results, return them
    if length(local_foods) > 0 do
      total_count = Nutrition.count_search_results(query, category)

      render(conn, "search.json", %{
        foods: local_foods,
        query: query,
        total_count: total_count,
        source: "local"
      })
    else
      # Fall back to OpenFoodFacts API
      case OpenFoodFacts.search_foods(query, limit: limit) do
        {:ok, %{foods: off_foods}} ->
          render(conn, "search.json", %{
            foods: off_foods,
            query: query,
            total_count: length(off_foods),
            source: "openfoodfacts"
          })

        {:error, reason} ->
          Logger.error("OpenFoodFacts search failed: #{inspect(reason)}")

          # Return empty results with error info
          render(conn, "search.json", %{
            foods: [],
            query: query,
            total_count: 0,
            error: "External API unavailable",
            source: "local"
          })
      end
    end
  end

  def popular(conn, params) do
    limit = Map.get(params, "limit", "20") |> String.to_integer()
    foods = Nutrition.get_popular_foods(limit)

    render(conn, "index.json", %{foods: foods})
  end

  def by_category(conn, %{"category" => category} = params) do
    limit = Map.get(params, "limit", "20") |> String.to_integer()
    offset = Map.get(params, "offset", "0") |> String.to_integer()

    foods = Nutrition.list_foods_by_category(category, %{limit: limit, offset: offset})
    total_count = Nutrition.count_foods(category)

    render(conn, "index.json", %{
      foods: foods,
      total_count: total_count,
      category: category
    })
  end

  def by_barcode(conn, %{"barcode" => barcode}) do
    case Nutrition.get_food_by_barcode(barcode) do
      nil -> {:error, :not_found}
      food -> render(conn, "show.json", food: food)
    end
  end

  def categories(conn, _params) do
    categories = Nutrition.list_categories()
    render(conn, "categories.json", categories: categories)
  end

  def favorites(conn, _params) do
    user = conn.assigns.current_user
    foods = Nutrition.get_user_favorite_foods(user.id)
    render(conn, "index.json", %{foods: foods})
  end

  def add_favorite(conn, %{"food_id" => food_id}) do
    user = conn.assigns.current_user

    case Nutrition.add_food_to_favorites(user.id, food_id) do
      {:ok, _favorite} ->
        json(conn, %{success: true, message: "Food added to favorites"})

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  def remove_favorite(conn, %{"id" => food_id}) do
    user = conn.assigns.current_user

    case Nutrition.remove_food_from_favorites(user.id, food_id) do
      {:ok, _} ->
        json(conn, %{success: true, message: "Food removed from favorites"})

      {:error, :not_found} ->
        {:error, :not_found}
    end
  end

  def recent(conn, params) do
    user = conn.assigns.current_user
    limit = Map.get(params, "limit", "20") |> String.to_integer()

    foods = Nutrition.get_user_recent_foods(user.id, limit)
    render(conn, "index.json", %{foods: foods})
  end

  def suggestions(conn, params) do
    user = conn.assigns.current_user
    meal_type = Map.get(params, "meal_type")
    time = Map.get(params, "time")
    preferences = Map.get(params, "preferences", [])

    suggestions =
      Nutrition.get_food_suggestions(user.id, %{
        meal_type: meal_type,
        time: time,
        preferences: preferences
      })

    render(conn, "suggestions.json", suggestions: suggestions)
  end

  def verify(conn, %{"name" => name} = params) do
    barcode = Map.get(params, "barcode")

    case Nutrition.verify_food_data(name, barcode) do
      {:ok, verification_result} ->
        render(conn, "verify.json", verification_result)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def extract_nutrition(conn, %{"image" => image_params}) do
    user = conn.assigns.current_user

    case Nutrition.extract_nutrition_from_image(image_params, user.id) do
      {:ok, nutrition_data} ->
        render(conn, "nutrition_extraction.json", nutrition_data)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def alternatives(conn, %{"id" => food_id}) do
    case Nutrition.get_food_alternatives(food_id) do
      {:ok, alternatives} ->
        render(conn, "alternatives.json", alternatives: alternatives)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def report(conn, %{"id" => food_id, "report" => report_params}) do
    user = conn.assigns.current_user

    report_params = Map.put(report_params, "user_id", user.id)
    report_params = Map.put(report_params, "food_id", food_id)

    case Nutrition.create_food_report(report_params) do
      {:ok, _report} ->
        json(conn, %{success: true, message: "Report submitted successfully"})

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  def bulk_search(conn, %{"food_names" => food_names}) do
    results = Nutrition.bulk_search_foods(food_names)
    render(conn, "bulk_search.json", results: results)
  end

  def barcode_lookup(conn, %{"barcode" => barcode}) do
    # Try local database first
    case Nutrition.get_food_by_barcode(barcode) do
      nil ->
        # Try OpenFoodFacts API
        case OpenFoodFacts.get_product_by_barcode(barcode) do
          {:ok, product_data} ->
            # Optionally save to local database for future use
            save_product_to_db(product_data)

            render(conn, "barcode.json", product: format_barcode_response(product_data))

          {:error, :not_found} ->
            {:error, :not_found}

          {:error, reason} ->
            Logger.error("OpenFoodFacts barcode lookup failed: #{inspect(reason)}")
            {:error, :external_api_error}
        end

      food ->
        # Convert local food to product format
        product_data = %{
          name: food.name,
          brand: food.brand || "",
          barcode: food.barcode,
          image_url: food.image_url,
          nutrition: %{
            calories: food.calories_per_100g,
            protein: food.protein_per_100g,
            carbs: food.carbs_per_100g,
            fat: food.fat_per_100g,
            fiber: food.fiber_per_100g,
            sugar: food.sugar_per_100g,
            sodium: food.sodium_per_100g
          },
          source: "local"
        }

        render(conn, "barcode.json", product: product_data)
    end
  end

  # Save OpenFoodFacts product to local database for future use
  defp save_product_to_db(product_data) do
    food_attrs = %{
      name: product_data.name,
      brand: product_data.brand,
      barcode: product_data.barcode,
      image_url: product_data.image_url,
      calories_per_100g: round(product_data.calories_per_100g),
      protein_per_100g: product_data.protein_per_100g,
      carbs_per_100g: product_data.carbs_per_100g,
      fat_per_100g: product_data.fat_per_100g,
      fiber_per_100g: product_data.fiber_per_100g,
      sugar_per_100g: product_data.sugar_per_100g,
      sodium_per_100g: product_data.sodium_per_100g,
      source: "openfoodfacts",
      verified: true,
      confidence_score: product_data.confidence
    }

    case Nutrition.create_food(food_attrs) do
      {:ok, _food} ->
        Logger.info("Saved OpenFoodFacts product to local DB: #{product_data.name}")

      {:error, changeset} ->
        Logger.warn("Failed to save OpenFoodFacts product: #{inspect(changeset.errors)}")
    end
  end

  defp format_barcode_response(product_data) do
    %{
      name: product_data.name,
      brand: product_data.brand || "",
      barcode: product_data.barcode,
      image_url: product_data.image_url,
      nutrition: %{
        calories: product_data.calories_per_100g,
        protein: product_data.protein_per_100g,
        carbs: product_data.carbs_per_100g,
        fat: product_data.fat_per_100g,
        fiber: product_data.fiber_per_100g || 0,
        sugar: product_data.sugar_per_100g || 0,
        sodium: product_data.sodium_per_100g || 0
      },
      confidence: product_data.confidence,
      source: product_data.source
    }
  end
end
