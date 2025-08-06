defmodule CalAiWeb.Api.V1.FoodController do
  use CalAiWeb, :controller

  alias CalAi.{Nutrition, Repo}
  alias CalAi.Nutrition.Food

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

    foods = Nutrition.search_foods(query, %{limit: limit, category: category})
    total_count = Nutrition.count_search_results(query, category)

    render(conn, "search.json", %{
      foods: foods,
      query: query,
      total_count: total_count
    })
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
end
