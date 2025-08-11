defmodule CalAi.Services.OpenFoodFacts do
  @moduledoc """
  Integration with Open Food Facts API for nutrition and product data.
  API documentation: https://openfoodfacts.github.io/openfoodfacts-server/api/
  """

  require Logger
  alias CalAi.Cache

  @base_url "https://world.openfoodfacts.org"
  @search_url "#{@base_url}/cgi/search.pl"
  @product_url "#{@base_url}/api/v0/product"

  @doc """
  Search for foods by name using Open Food Facts API with enhanced matching.
  Returns standardized nutrition data with confidence scoring.
  """
  def search_foods(query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    page = Keyword.get(opts, :page, 1)
    exact_match = Keyword.get(opts, :exact_match, false)

    # Check cache first
    cache_key = "off_search:#{String.downcase(query)}:#{page}:#{limit}:#{exact_match}"

    case Cache.get(cache_key) do
      {:ok, cached_results} ->
        Logger.info("OpenFoodFacts search cache hit for query: #{query}")
        {:ok, cached_results}

      {:miss, _} ->
        Logger.info("OpenFoodFacts search cache miss, fetching from API: #{query}")

        # Try exact match first if requested, then broader search
        search_terms =
          if exact_match do
            query
          else
            # Clean and expand query for better matching
            expand_search_query(query)
          end

        params = [
          {"search_terms", search_terms},
          {"search_simple", "1"},
          {"action", "process"},
          {"json", "1"},
          {"page_size", limit},
          {"page", page},
          {"fields",
           "code,product_name,brands,image_url,nutriments,categories_tags,serving_size,nutrition_grade_fr,ecoscore_grade"}
        ]

        url = "#{@search_url}?" <> URI.encode_query(params)

        case HTTPoison.get(url, headers(), recv_timeout: 15_000) do
          {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
            case Jason.decode(body) do
              {:ok, %{"products" => products}} ->
                standardized_foods =
                  products
                  |> Enum.map(&standardize_product_enhanced/1)
                  |> Enum.filter(&has_valid_nutrition/1)
                  |> add_confidence_scores(query)
                  |> Enum.sort_by(& &1.confidence, :desc)

                result = %{
                  foods: standardized_foods,
                  total_count: length(standardized_foods),
                  query: query,
                  source: "openfoodfacts"
                }

                # Cache for 1 hour
                Cache.put(cache_key, result, 3600)
                {:ok, result}

              {:error, reason} ->
                Logger.error("Failed to parse OpenFoodFacts response: #{inspect(reason)}")
                {:error, :invalid_response}
            end

          {:ok, %HTTPoison.Response{status_code: status_code}} ->
            Logger.error("OpenFoodFacts API returned status: #{status_code}")
            {:error, :api_error}

          {:error, reason} ->
            Logger.error("OpenFoodFacts API request failed: #{inspect(reason)}")
            {:error, :network_error}
        end
    end
  end

  @doc """
  Get product by barcode from Open Food Facts API.
  """
  def get_product_by_barcode(barcode) do
    # Check cache first
    case Cache.get_cached_barcode(barcode) do
      {:ok, cached_product} ->
        Logger.info("OpenFoodFacts barcode cache hit: #{barcode}")
        {:ok, cached_product}

      {:miss, _} ->
        Logger.info("OpenFoodFacts barcode cache miss, fetching: #{barcode}")

        url = "#{@product_url}/#{barcode}.json"

        case HTTPoison.get(url, headers(), recv_timeout: 10_000) do
          {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
            case Jason.decode(body) do
              {:ok, %{"status" => 1, "product" => product}} ->
                standardized_product = standardize_product(product)

                # Cache for 24 hours (barcodes don't change often)
                Cache.cache_barcode(barcode, standardized_product)
                {:ok, standardized_product}

              {:ok, %{"status" => 0}} ->
                Logger.info("Product not found in OpenFoodFacts: #{barcode}")
                {:error, :not_found}

              {:error, reason} ->
                Logger.error("Failed to parse OpenFoodFacts product response: #{inspect(reason)}")
                {:error, :invalid_response}
            end

          {:ok, %HTTPoison.Response{status_code: 404}} ->
            {:error, :not_found}

          {:ok, %HTTPoison.Response{status_code: status_code}} ->
            Logger.error("OpenFoodFacts product API returned status: #{status_code}")
            {:error, :api_error}

          {:error, reason} ->
            Logger.error("OpenFoodFacts product API request failed: #{inspect(reason)}")
            {:error, :network_error}
        end
    end
  end

  @doc """
  Standardize OpenFoodFacts product data to our internal format.
  """
  defp standardize_product(product) do
    nutriments = Map.get(product, "nutriments", %{})

    %{
      id: Map.get(product, "code"),
      name: get_product_name(product),
      brand: get_brand(product),
      barcode: Map.get(product, "code"),
      image_url: Map.get(product, "image_url"),
      categories: Map.get(product, "categories_tags", []),
      serving_size: Map.get(product, "serving_size"),

      # Nutrition per 100g (OpenFoodFacts standard)
      calories_per_100g: get_nutrient(nutriments, "energy-kcal_100g"),
      protein_per_100g: get_nutrient(nutriments, "proteins_100g"),
      carbs_per_100g: get_nutrient(nutriments, "carbohydrates_100g"),
      fat_per_100g: get_nutrient(nutriments, "fat_100g"),
      fiber_per_100g: get_nutrient(nutriments, "fiber_100g"),
      sugar_per_100g: get_nutrient(nutriments, "sugars_100g"),
      sodium_per_100g: get_nutrient(nutriments, "sodium_100g"),
      salt_per_100g: get_nutrient(nutriments, "salt_100g"),

      # Additional nutrients
      vitamins: extract_vitamins(nutriments),
      minerals: extract_minerals(nutriments),

      # Metadata
      source: "openfoodfacts",
      confidence: calculate_confidence(product),
      # OpenFoodFacts data is community verified
      verified: true,
      last_updated: DateTime.utc_now()
    }
  end

  defp get_product_name(product) do
    Map.get(product, "product_name") ||
      Map.get(product, "product_name_en") ||
      Map.get(product, "generic_name") ||
      "Unknown Product"
  end

  defp get_brand(product) do
    brands = Map.get(product, "brands")
    if brands && brands != "", do: brands, else: nil
  end

  defp get_nutrient(nutriments, key) when is_map(nutriments) do
    case Map.get(nutriments, key) do
      value when is_number(value) ->
        value

      value when is_binary(value) ->
        case Float.parse(value) do
          {float_val, _} -> float_val
          :error -> 0
        end

      _ ->
        0
    end
  end

  defp get_nutrient(_, _), do: 0

  defp extract_vitamins(nutriments) do
    vitamin_keys = [
      "vitamin-a_100g",
      "vitamin-c_100g",
      "vitamin-d_100g",
      "vitamin-e_100g",
      "vitamin-k_100g",
      "vitamin-b1_100g",
      "vitamin-b2_100g",
      "vitamin-b6_100g",
      "vitamin-b12_100g"
    ]

    Enum.reduce(vitamin_keys, %{}, fn key, acc ->
      case Map.get(nutriments, key) do
        nil -> acc
        value -> Map.put(acc, key, get_nutrient(nutriments, key))
      end
    end)
  end

  defp extract_minerals(nutriments) do
    mineral_keys = [
      "calcium_100g",
      "iron_100g",
      "magnesium_100g",
      "phosphorus_100g",
      "potassium_100g",
      "zinc_100g"
    ]

    Enum.reduce(mineral_keys, %{}, fn key, acc ->
      case Map.get(nutriments, key) do
        nil -> acc
        value -> Map.put(acc, key, get_nutrient(nutriments, key))
      end
    end)
  end

  defp calculate_confidence(product) do
    # Calculate confidence based on data completeness
    nutriments = Map.get(product, "nutriments", %{})
    required_fields = ["energy-kcal_100g", "proteins_100g", "carbohydrates_100g", "fat_100g"]

    present_fields =
      Enum.count(required_fields, fn field ->
        Map.has_key?(nutriments, field) && Map.get(nutriments, field) != nil
      end)

    base_confidence = present_fields / length(required_fields)

    # Bonus for having image and brand
    bonus = 0
    if Map.get(product, "image_url"), do: bonus = bonus + 0.1
    if Map.get(product, "brands"), do: bonus = bonus + 0.1

    min(base_confidence + bonus, 1.0)
  end

  # Enhanced helper functions

  defp expand_search_query(query) do
    # Clean and expand search query for better matching
    query
    |> String.downcase()
    |> String.replace(~r/[_-]/, " ")
    |> String.trim()
  end

  defp standardize_product_enhanced(product) do
    nutriments = Map.get(product, "nutriments", %{})

    %{
      code: Map.get(product, "code"),
      name: get_product_name(product),
      brand: get_brand(product),
      image_url: Map.get(product, "image_url"),
      calories_per_100g: get_nutrient(nutriments, "energy-kcal_100g"),
      protein_per_100g: get_nutrient(nutriments, "proteins_100g"),
      carbs_per_100g: get_nutrient(nutriments, "carbohydrates_100g"),
      fat_per_100g: get_nutrient(nutriments, "fat_100g"),
      fiber_per_100g: get_nutrient(nutriments, "fiber_100g"),
      sugar_per_100g: get_nutrient(nutriments, "sugars_100g"),
      sodium_per_100g: get_nutrient(nutriments, "sodium_100g"),
      salt_per_100g: get_nutrient(nutriments, "salt_100g"),
      saturated_fat_per_100g: get_nutrient(nutriments, "saturated-fat_100g"),
      serving_size: Map.get(product, "serving_size"),
      categories: Map.get(product, "categories_tags", []),
      nutrition_grade: Map.get(product, "nutrition_grade_fr"),
      ecoscore: Map.get(product, "ecoscore_grade"),
      vitamins: extract_vitamins(nutriments),
      minerals: extract_minerals(nutriments),
      confidence: calculate_confidence(product),
      data_quality: assess_data_quality(product),
      allergens: extract_allergens(product)
    }
  end

  defp has_valid_nutrition(food) do
    # Ensure minimum nutrition data is present
    food.calories_per_100g > 0 &&
      (food.protein_per_100g > 0 || food.carbs_per_100g > 0 || food.fat_per_100g > 0)
  end

  defp add_confidence_scores(foods, original_query) do
    Enum.map(foods, fn food ->
      name_similarity = calculate_name_similarity(food.name, original_query)
      brand_bonus = if food.brand, do: 0.1, else: 0
      image_bonus = if food.image_url, do: 0.05, else: 0

      adjusted_confidence =
        min(1.0, food.confidence + name_similarity * 0.3 + brand_bonus + image_bonus)

      %{food | confidence: adjusted_confidence}
    end)
  end

  defp calculate_name_similarity(name1, name2) do
    # Simple Levenshtein-based similarity
    name1_clean = String.downcase(String.trim(name1))
    name2_clean = String.downcase(String.trim(name2))

    if String.contains?(name1_clean, name2_clean) || String.contains?(name2_clean, name1_clean) do
      0.8
    else
      # Check for common words
      words1 = String.split(name1_clean, " ")
      words2 = String.split(name2_clean, " ")

      common_words = length(words1 -- (words1 -- words2))
      max_words = max(length(words1), length(words2))

      if max_words > 0, do: common_words / max_words, else: 0
    end
  end

  defp assess_data_quality(product) do
    nutriments = Map.get(product, "nutriments", %{})

    # Count available nutrition fields
    nutrition_fields = [
      "energy-kcal_100g",
      "proteins_100g",
      "carbohydrates_100g",
      "fat_100g",
      "fiber_100g",
      "sugars_100g",
      "sodium_100g",
      "saturated-fat_100g"
    ]

    available_nutrition =
      Enum.count(nutrition_fields, fn field ->
        Map.has_key?(nutriments, field) && Map.get(nutriments, field) != nil
      end)

    cond do
      available_nutrition >= 6 -> "high"
      available_nutrition >= 4 -> "medium"
      available_nutrition >= 2 -> "low"
      true -> "minimal"
    end
  end

  defp extract_allergens(product) do
    allergens_tags = Map.get(product, "allergens_tags", [])

    allergens_tags
    |> Enum.filter(&String.starts_with?(&1, "en:"))
    |> Enum.map(&String.replace(&1, "en:", ""))
    |> Enum.map(&String.replace(&1, "-", " "))
    |> Enum.map(&String.capitalize/1)
  end

  defp headers do
    [
      {"User-Agent", "CalAi-App/1.0 (contact@calai.app)"},
      {"Accept", "application/json"}
    ]
  end
end
