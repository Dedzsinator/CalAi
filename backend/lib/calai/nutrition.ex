defmodule CalAi.Nutrition do
  @moduledoc """
  The Nutrition context.
  Handles all nutrition-related data and operations including foods, nutrition analysis,
  food recognition, and dietary recommendations.
  """

  import Ecto.Query, warn: false
  alias CalAi.Repo
  alias CalAi.Nutrition.Food
  require Logger

  @doc """
  Returns the list of foods with optional filtering and pagination.

  ## Examples

      iex> list_foods(%{page: 1, limit: 10})
      [%Food{}, ...]

      iex> list_foods(%{category: "fruits"})
      [%Food{}, ...]

  """
  def list_foods(params \\ %{}) do
    query = from(f in Food)

    query
    |> apply_filters(params)
    |> apply_pagination(params)
    |> Repo.all()
  end

  @doc """
  Gets a single food.

  Raises `Ecto.NoResultsError` if the Food does not exist.

  ## Examples

      iex> get_food!(123)
      %Food{}

      iex> get_food!(456)
      ** (Ecto.NoResultsError)

  """
  def get_food!(id), do: Repo.get!(Food, id)

  @doc """
  Gets a single food.

  Returns nil if the Food does not exist.

  ## Examples

      iex> get_food(123)
      %Food{}

      iex> get_food(456)
      nil

  """
  def get_food(id), do: Repo.get(Food, id)

  @doc """
  Creates a food.

  ## Examples

      iex> create_food(%{field: value})
      {:ok, %Food{}}

      iex> create_food(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_food(attrs \\ %{}) do
    %Food{}
    |> Food.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a food.

  ## Examples

      iex> update_food(food, %{field: new_value})
      {:ok, %Food{}}

      iex> update_food(food, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_food(%Food{} = food, attrs) do
    food
    |> Food.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a food.

  ## Examples

      iex> delete_food(food)
      {:ok, %Food{}}

      iex> delete_food(food)
      {:error, %Ecto.Changeset{}}

  """
  def delete_food(%Food{} = food) do
    Repo.delete(food)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking food changes.

  ## Examples

      iex> change_food(food)
      %Ecto.Changeset{data: %Food{}}

  """
  def change_food(%Food{} = food, attrs \\ %{}) do
    Food.changeset(food, attrs)
  end

  @doc """
  Counts foods with optional category filter.
  """
  def count_foods(category \\ nil) do
    query = from(f in Food)

    query =
      if category do
        from(f in query, where: f.category == ^category)
      else
        query
      end

    Repo.aggregate(query, :count, :id)
  end

  @doc """
  Search foods by name or description.
  """
  def search_foods(query, params \\ %{}) when is_binary(query) do
    search_term = "%#{query}%"

    from(f in Food,
      where: ilike(f.name, ^search_term) or ilike(f.description, ^search_term)
    )
    |> apply_filters(params)
    |> apply_pagination(params)
    |> Repo.all()
  end

  @doc """
  Count search results.
  """
  def count_search_results(query, category \\ nil) when is_binary(query) do
    search_term = "%#{query}%"

    base_query =
      from(f in Food,
        where: ilike(f.name, ^search_term) or ilike(f.description, ^search_term)
      )

    query =
      if category do
        from(f in base_query, where: f.category == ^category)
      else
        base_query
      end

    Repo.aggregate(query, :count, :id)
  end

  @doc """
  Get popular foods based on usage statistics.
  """
  def get_popular_foods(limit \\ 10) do
    # TODO: Implement popularity ranking based on meal usage
    # For now, return first foods ordered by name
    from(f in Food, order_by: f.name, limit: ^limit)
    |> Repo.all()
  end

  @doc """
  List foods by category.
  """
  def list_foods_by_category(category, params \\ %{}) do
    from(f in Food, where: f.category == ^category)
    |> apply_pagination(params)
    |> Repo.all()
  end

  @doc """
  Get food by barcode.
  """
  def get_food_by_barcode(barcode) do
    Repo.get_by(Food, barcode: barcode)
  end

  @doc """
  List all food categories.
  """
  def list_categories do
    from(f in Food, select: f.category, distinct: true, where: not is_nil(f.category))
    |> Repo.all()
  end

  @doc """
  Get user's favorite foods.
  """
  def get_user_favorite_foods(user_id) do
    # TODO: Implement user favorites system
    # For now, return empty list
    Logger.debug("Getting favorite foods for user #{user_id}")
    []
  end

  @doc """
  Add food to user's favorites.
  """
  def add_food_to_favorites(user_id, food_id) do
    # TODO: Implement user favorites system
    Logger.debug("Adding food #{food_id} to favorites for user #{user_id}")
    {:ok, %{}}
  end

  @doc """
  Remove food from user's favorites.
  """
  def remove_food_from_favorites(user_id, food_id) do
    # TODO: Implement user favorites system
    Logger.debug("Removing food #{food_id} from favorites for user #{user_id}")
    {:ok, %{}}
  end

  @doc """
  Get user's recent foods.
  """
  def get_user_recent_foods(user_id, limit \\ 10) do
    # TODO: Implement recent foods tracking
    # For now, return empty list
    Logger.debug("Getting recent foods for user #{user_id} (limit: #{limit})")
    []
  end

  @doc """
  Get food suggestions for user based on preferences and history.
  """
  def get_food_suggestions(user_id, params \\ %{}) do
    # TODO: Implement AI-powered food suggestions
    Logger.debug("Getting food suggestions for user #{user_id} with params: #{inspect(params)}")
    []
  end

  @doc """
  Verify food data against external databases.
  """
  def verify_food_data(name, barcode \\ nil) do
    # TODO: Implement food data verification
    Logger.debug("Verifying food data for '#{name}' with barcode: #{barcode}")
    {:ok, %{verified: false, confidence: 0.0}}
  end

  @doc """
  Extract nutrition information from food image using AI.
  """
  def extract_nutrition_from_image(image_params, user_id) do
    # TODO: Implement AI-powered nutrition extraction
    Logger.debug("Extracting nutrition from image for user #{user_id}: #{inspect(image_params)}")
    {:error, :not_implemented}
  end

  @doc """
  Get food alternatives based on dietary restrictions and preferences.
  """
  def get_food_alternatives(food_id) do
    # TODO: Implement food alternatives suggestion system
    Logger.debug("Getting alternatives for food #{food_id}")
    {:ok, []}
  end

  @doc """
  Create a food report (for incorrect data, etc.).
  """
  def create_food_report(report_params) do
    # TODO: Implement food reporting system
    Logger.debug("Creating food report: #{inspect(report_params)}")
    {:ok, %{id: :rand.uniform(1000), status: "pending"}}
  end

  @doc """
  Bulk search multiple foods by name.
  """
  def bulk_search_foods(food_names) when is_list(food_names) do
    # TODO: Optimize bulk search with single query
    Logger.debug("Bulk searching foods: #{inspect(food_names)}")

    Enum.map(food_names, fn name ->
      %{name: name, results: search_foods(name, %{limit: 5})}
    end)
  end

  # Private helper functions

  defp apply_filters(query, params) do
    Enum.reduce(params, query, fn
      {:category, category}, query when not is_nil(category) ->
        from(f in query, where: f.category == ^category)

      _filter, query ->
        query
    end)
  end

  defp apply_pagination(query, params) do
    limit = Map.get(params, :limit, 20)
    offset = Map.get(params, :offset, 0)
    page = Map.get(params, :page, 1)

    # If page is provided, calculate offset
    offset = if page > 1, do: (page - 1) * limit, else: offset

    query
    |> limit(^limit)
    |> offset(^offset)
  end
end
