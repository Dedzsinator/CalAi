defmodule CalAi.Services.FoodRecognition do
  @moduledoc """
  Food recognition service using pretrained models.
  Supports local trained model server (priority) and HuggingFace fallback.
  """

  require Logger
  alias CalAi.Services.OpenFoodFacts
  alias CalAi.Cache

  # Local trained model server (priority)
  @local_model_url "http://localhost:5000"
  # HuggingFace configuration (fallback)
  @huggingface_base "https://api-inference.huggingface.co/models"
  @default_model "nateraw/food"
  @efficient_net_model "microsoft/resnet-50"

  # Food-101 class labels
  @food101_classes [
    "apple_pie",
    "baby_back_ribs",
    "baklava",
    "beef_carpaccio",
    "beef_tartare",
    "beet_salad",
    "beignets",
    "bibimbap",
    "bread_pudding",
    "breakfast_burrito",
    "bruschetta",
    "caesar_salad",
    "cannoli",
    "caprese_salad",
    "carrot_cake",
    "ceviche",
    "cheese_plate",
    "cheesecake",
    "chicken_curry",
    "chicken_quesadilla",
    "chicken_wings",
    "chocolate_cake",
    "chocolate_mousse",
    "churros",
    "clam_chowder",
    "club_sandwich",
    "crab_cakes",
    "creme_brulee",
    "croque_madame",
    "cup_cakes",
    "deviled_eggs",
    "donuts",
    "dumplings",
    "edamame",
    "eggs_benedict",
    "escargots",
    "falafel",
    "filet_mignon",
    "fish_and_chips",
    "foie_gras",
    "french_fries",
    "french_onion_soup",
    "french_toast",
    "fried_calamari",
    "fried_rice",
    "frozen_yogurt",
    "garlic_bread",
    "gnocchi",
    "greek_salad",
    "grilled_cheese_sandwich",
    "grilled_salmon",
    "guacamole",
    "gyoza",
    "hamburger",
    "hot_and_sour_soup",
    "hot_dog",
    "huevos_rancheros",
    "hummus",
    "ice_cream",
    "lasagna",
    "lobster_bisque",
    "lobster_roll_sandwich",
    "macaroni_and_cheese",
    "macarons",
    "miso_soup",
    "mussels",
    "nachos",
    "omelette",
    "onion_rings",
    "oysters",
    "pad_thai",
    "paella",
    "pancakes",
    "panna_cotta",
    "peking_duck",
    "pho",
    "pizza",
    "pork_chop",
    "poutine",
    "prime_rib",
    "pulled_pork_sandwich",
    "ramen",
    "ravioli",
    "red_velvet_cake",
    "risotto",
    "samosa",
    "sashimi",
    "scallops",
    "seaweed_salad",
    "shrimp_and_grits",
    "spaghetti_bolognese",
    "spaghetti_carbonara",
    "spring_rolls",
    "steak",
    "strawberry_shortcake",
    "sushi",
    "tacos",
    "takoyaki",
    "tiramisu",
    "tuna_tartare",
    "waffles"
  ]

  @doc """
  Main entry point for food classification.

  Prioritizes local model server, falls back to HuggingFace if needed.
  Returns enhanced predictions with OpenFoodFacts nutrition data.
  """
  def classify_food_image(image_data, opts \\ []) do
    max_predictions = Keyword.get(opts, :max_predictions, 5)
    use_fallback = Keyword.get(opts, :use_fallback, true)

    Logger.info("Starting food classification with local model priority")

    # Try local model server first
    case call_local_model(image_data, max_predictions) do
      {:ok, predictions} ->
        Logger.info("✅ Local model server successful, enhancing predictions")
        enhanced_predictions = add_portion_estimates_and_images(predictions)

        result = %{
          predictions: enhanced_predictions,
          model: "local-best_model.pth",
          cached: false,
          enhanced: true,
          fallback: false
        }

        {:ok, result}

      {:error, reason} ->
        Logger.warn("Local model server failed (#{inspect(reason)}), trying fallback")

        if use_fallback do
          # Fallback to HuggingFace
          case call_huggingface_api_with_fallback(@default_model, image_data, true) do
            {:ok, predictions} ->
              Logger.info("✅ HuggingFace fallback successful")
              enhanced_predictions = add_portion_estimates_and_images(predictions)

              result = %{
                predictions: enhanced_predictions,
                model: @default_model,
                cached: false,
                enhanced: true,
                fallback: true
              }

              {:ok, result}

            {:error, fallback_reason} ->
              Logger.error("All AI services failed, creating fallback prediction")
              fallback_result = create_fallback_prediction("image_hash")
              {:ok, fallback_result}
          end
        else
          {:error, reason}
        end
    end
  end

  # Private functions

  defp call_local_model(image_data, max_predictions) do
    url = "#{@local_model_url}/predict"

    headers = [
      {"Content-Type", "multipart/form-data"}
    ]

    # Prepare multipart form data
    multipart =
      {:multipart,
       [
         {"image", image_data,
          {"form-data", [{"name", "\"image\""}, {"filename", "\"food.jpg\""}]},
          [{"Content-Type", "image/jpeg"}]},
         {"top_k", to_string(max_predictions), {"form-data", [{"name", "\"top_k\""}]}, []},
         {"nutrition", "true", {"form-data", [{"name", "\"nutrition\""}]}, []}
       ]}

    case HTTPoison.post(url, multipart, headers, recv_timeout: 15_000) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, %{"success" => true, "predictions" => predictions}} ->
            processed =
              Enum.map(predictions, fn pred ->
                nutrition = pred["estimated_nutrition"] || %{}

                %{
                  food_name: format_food_name(pred["food_name"]),
                  confidence: pred["confidence"],
                  raw_label: pred["raw_class_name"],
                  calories: nutrition["calories"] || 0,
                  protein: nutrition["protein"] || 0,
                  carbs: nutrition["carbs"] || 0,
                  fat: nutrition["fat"] || 0
                }
              end)

            {:ok, processed}

          {:ok, %{"success" => false, "error" => error}} ->
            Logger.error("Local model API error: #{error}")
            {:error, :api_error}

          {:error, reason} ->
            Logger.error("Failed to parse local model response: #{inspect(reason)}")
            {:error, :invalid_response}
        end

      {:ok, %HTTPoison.Response{status_code: status_code, body: body}} ->
        Logger.error("Local model API returned status #{status_code}: #{body}")
        {:error, :api_error}

      {:error, reason} ->
        Logger.warn("Local model API request failed: #{inspect(reason)}")
        {:error, :network_error}
    end
  end

  defp call_huggingface_api_with_fallback(model, image_data, use_fallback) do
    case call_huggingface_api(model, image_data) do
      {:ok, predictions} ->
        {:ok, predictions}

      {:error, _reason} when use_fallback ->
        Logger.info("Primary model failed, trying fallback model: #{@efficient_net_model}")
        call_huggingface_api(@efficient_net_model, image_data)

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp create_fallback_prediction(image_hash) do
    Logger.info("Creating fallback prediction for image: #{String.slice(image_hash, 0, 8)}")

    # Create a generic "mixed meal" prediction when AI fails
    fallback_prediction = %{
      food_name: "Mixed meal",
      confidence: 0.3,
      calories: 400,
      protein: 20,
      carbs: 45,
      fat: 18,
      fiber: 5,
      sugar: 8,
      portion_estimate: "1 serving",
      image_url: nil,
      source: "fallback"
    }

    %{
      predictions: [fallback_prediction],
      model: "fallback",
      processing_time_ms: 0,
      cached: false,
      enhanced: false,
      fallback: true
    }
  end

  defp add_portion_estimates_and_images(predictions) do
    Enum.map(predictions, fn prediction ->
      # Add more sophisticated portion estimation based on food type
      enhanced_portion = get_enhanced_portion_estimate(prediction.food_name)

      Map.merge(prediction, %{
        portion_estimate: enhanced_portion,
        serving_suggestions: get_serving_suggestions(prediction.food_name),
        nutritional_density: calculate_nutritional_density(prediction)
      })
    end)
  end

  defp get_enhanced_portion_estimate(food_name) do
    food_lower = String.downcase(food_name)

    cond do
      # Main dishes
      String.contains?(food_lower, ["burger", "sandwich", "wrap"]) ->
        "1 piece (150-200g)"

      String.contains?(food_lower, ["pizza"]) ->
        "2 slices (150g)"

      String.contains?(food_lower, ["steak", "chicken breast", "fish fillet"]) ->
        "1 piece (150-200g)"

      String.contains?(food_lower, ["pasta", "spaghetti", "noodles"]) ->
        "1 cup cooked (140g)"

      String.contains?(food_lower, ["rice", "quinoa"]) ->
        "1 cup cooked (195g)"

      # Soups and liquids
      String.contains?(food_lower, ["soup", "broth", "chowder"]) ->
        "1 cup (240ml)"

      # Salads and vegetables
      String.contains?(food_lower, ["salad"]) ->
        "1 large bowl (200g)"

      String.contains?(food_lower, ["vegetable", "broccoli", "carrot"]) ->
        "1 cup (100g)"

      # Desserts
      String.contains?(food_lower, ["cake", "pie"]) ->
        "1 slice (80g)"

      String.contains?(food_lower, ["ice cream", "frozen yogurt"]) ->
        "1 scoop (65g)"

      String.contains?(food_lower, ["cookie", "donut"]) ->
        "1 piece (30g)"

      # Fruits
      String.contains?(food_lower, ["apple", "orange", "banana"]) ->
        "1 medium fruit"

      String.contains?(food_lower, ["berry", "grapes"]) ->
        "1 cup (150g)"

      # Default
      true ->
        "1 serving (100g)"
    end
  end

  defp get_serving_suggestions(food_name) do
    food_lower = String.downcase(food_name)

    cond do
      String.contains?(food_lower, ["salad"]) ->
        ["Small (150g)", "Regular (200g)", "Large (300g)"]

      String.contains?(food_lower, ["pasta", "rice"]) ->
        ["Small (100g)", "Regular (140g)", "Large (200g)"]

      String.contains?(food_lower, ["pizza"]) ->
        ["1 slice (75g)", "2 slices (150g)", "3 slices (225g)"]

      String.contains?(food_lower, ["sandwich", "burger"]) ->
        ["Half (75g)", "Whole (150g)", "Large (200g)"]

      true ->
        ["Small portion", "Regular portion", "Large portion"]
    end
  end

  defp calculate_nutritional_density(prediction) do
    # Calculate calories per gram to determine nutritional density
    total_macros = prediction[:protein] + prediction[:carbs] + prediction[:fat]
    calories = prediction[:calories]

    cond do
      calories < 100 -> "Low calorie"
      calories > 300 -> "High calorie"
      total_macros > 50 -> "Nutrient dense"
      true -> "Moderate"
    end
  end

  defp call_huggingface_api(model, image_data) do
    url = "#{@huggingface_base}/#{model}"

    headers = [
      {"Authorization", "Bearer #{huggingface_token()}"},
      {"Content-Type", "application/octet-stream"}
    ]

    case HTTPoison.post(url, image_data, headers, recv_timeout: 30_000) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, predictions} when is_list(predictions) ->
            processed =
              Enum.map(predictions, fn pred ->
                %{
                  food_name: format_food_name(pred["label"]),
                  confidence: pred["score"],
                  raw_label: pred["label"]
                }
              end)

            {:ok, processed}

          {:ok, %{"error" => error}} ->
            Logger.error("Hugging Face API error: #{error}")
            {:error, :api_error}

          {:error, reason} ->
            Logger.error("Failed to parse Hugging Face response: #{inspect(reason)}")
            {:error, :invalid_response}
        end

      {:ok, %HTTPoison.Response{status_code: 503}} ->
        Logger.warn("Hugging Face model loading, retrying...")
        # Model is loading, wait and retry once
        :timer.sleep(2000)
        call_huggingface_api(model, image_data)

      {:ok, %HTTPoison.Response{status_code: status_code, body: body}} ->
        Logger.error("Hugging Face API returned status #{status_code}: #{body}")
        {:error, :api_error}

      {:error, reason} ->
        Logger.error("Hugging Face API request failed: #{inspect(reason)}")
        {:error, :network_error}
    end
  end

  defp enhance_prediction_with_nutrition(prediction) do
    food_name = prediction.food_name || prediction[:food_name]
    confidence = prediction.confidence || prediction[:confidence] || 0.5

    # Try to get nutrition data from OpenFoodFacts
    case OpenFoodFacts.search_foods(food_name, limit: 1) do
      {:ok, %{foods: [first_food | _]}} ->
        %{
          food_name: food_name,
          confidence: confidence,
          calories: first_food.calories_per_100g,
          protein: first_food.protein_per_100g,
          carbs: first_food.carbs_per_100g,
          fat: first_food.fat_per_100g,
          fiber: first_food.fiber_per_100g || 0,
          sugar: first_food.sugar_per_100g || 0,
          portion_estimate: estimate_portion_size(food_name),
          image_url: first_food.image_url,
          source: "enhanced"
        }

      _ ->
        # Fall back to estimated nutrition based on food type
        estimated_nutrition = estimate_nutrition_by_type(food_name)

        Map.merge(estimated_nutrition, %{
          food_name: food_name,
          confidence: confidence,
          portion_estimate: estimate_portion_size(food_name),
          source: "estimated"
        })
    end
  end

  defp format_food_name(raw_label) when is_binary(raw_label) do
    raw_label
    |> String.replace("_", " ")
    |> String.split()
    |> Enum.map(&String.capitalize/1)
    |> Enum.join(" ")
  end

  defp estimate_portion_size(food_name) do
    food_lower = String.downcase(food_name)

    cond do
      String.contains?(food_lower, ["pie", "cake", "pizza"]) -> "1 slice"
      String.contains?(food_lower, ["sandwich", "burger", "hot dog"]) -> "1 piece"
      String.contains?(food_lower, ["salad", "soup", "rice", "pasta"]) -> "1 cup"
      String.contains?(food_lower, ["steak", "chicken", "fish"]) -> "150g"
      String.contains?(food_lower, ["apple", "banana", "orange"]) -> "1 medium"
      String.contains?(food_lower, ["fries", "wings"]) -> "1 serving"
      true -> "100g"
    end
  end

  defp estimate_nutrition_by_type(food_name) do
    food_lower = String.downcase(food_name)

    cond do
      # Fruits
      String.contains?(food_lower, ["apple", "banana", "orange", "berry"]) ->
        %{calories: 50, protein: 0.5, carbs: 12, fat: 0.2}

      # Vegetables
      String.contains?(food_lower, ["salad", "vegetable", "carrot", "broccoli"]) ->
        %{calories: 25, protein: 2, carbs: 5, fat: 0.1}

      # Proteins
      String.contains?(food_lower, ["chicken", "beef", "fish", "steak"]) ->
        %{calories: 200, protein: 25, carbs: 0, fat: 8}

      # Grains/Starches
      String.contains?(food_lower, ["rice", "pasta", "bread", "potato"]) ->
        %{calories: 150, protein: 4, carbs: 30, fat: 1}

      # Desserts
      String.contains?(food_lower, ["cake", "ice cream", "chocolate", "cookie"]) ->
        %{calories: 300, protein: 4, carbs: 40, fat: 15}

      # Default
      true ->
        %{calories: 100, protein: 5, carbs: 15, fat: 3}
    end
  end

  defp fuzzy_match_food101(query, limit) do
    normalized_query = String.downcase(query)

    @food101_classes
    |> Enum.map(fn class ->
      normalized_class = class |> String.replace("_", " ") |> String.downcase()
      similarity = string_similarity(normalized_query, normalized_class)

      %{
        food_name: format_food_name(class),
        confidence: similarity,
        source: "food101_fuzzy"
      }
    end)
    |> Enum.filter(fn pred -> pred.confidence > 0.3 end)
    |> Enum.sort_by(& &1.confidence, :desc)
    |> Enum.take(limit)
  end

  # Simple string similarity using Jaro-Winkler-like algorithm
  defp string_similarity(str1, str2) do
    if str1 == str2 do
      1.0
    else
      # Simple implementation - in production use a proper library like :string_similarity
      common_chars = count_common_chars(str1, str2)
      max_length = max(String.length(str1), String.length(str2))

      if max_length == 0, do: 0.0, else: common_chars / max_length
    end
  end

  defp count_common_chars(str1, str2) do
    chars1 = String.graphemes(str1) |> MapSet.new()
    chars2 = String.graphemes(str2) |> MapSet.new()

    MapSet.intersection(chars1, chars2) |> MapSet.size()
  end

  defp huggingface_token do
    # In production, store this in environment variables
    System.get_env("HUGGINGFACE_API_TOKEN") ||
      Application.get_env(:calai, :huggingface_token) ||
      "hf_placeholder_token"
  end
end
